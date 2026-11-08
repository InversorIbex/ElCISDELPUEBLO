import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import {
  digest,
  privateSecret,
  seal,
  unseal,
  validateSecret,
} from "./crypto.ts";
import { transaction } from "./db.ts";
export class ParticipationError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}
type Choice = { municipalityCode: string; optionId: string };
type Submission = Choice & {
  campaignId: string;
  token: string;
  credential: string;
  consentVersion: string;
  explicitConsent: boolean;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function requireUuid(value: string) {
  if (!uuid.test(value)) throw new ParticipationError("INVALID_ID");
}
export class TestParticipationService {
  private pool: Pool;
  private encryptionKey: Buffer;
  private hashKey: Buffer;
  constructor(pool: Pool, encryptionKey: Buffer, hashKey: Buffer) {
    this.pool = pool;
    this.encryptionKey = encryptionKey;
    this.hashKey = hashKey;
    if (process.env.NODE_ENV === "production")
      throw new Error("TEST_ENGINE_ONLY");
    if (
      encryptionKey.length !== 32 ||
      hashKey.length !== 32 ||
      encryptionKey.equals(hashKey)
    )
      throw new Error("INDEPENDENT_KEYS_REQUIRED");
  }
  private async campaign(client: PoolClient, id: string, allowClosed = false) {
    requireUuid(id);
    const result = await client.query(
      "SELECT * FROM catalog.campaigns WHERE id=$1 FOR UPDATE",
      [id],
    );
    const c = result.rows[0];
    if (!c || c.is_test !== true)
      throw new ParticipationError("TEST_CAMPAIGN_REQUIRED");
    if (c.status !== "open" && !(allowClosed && c.status === "closed"))
      throw new ParticipationError("CAMPAIGN_CLOSED");
    return c;
  }
  private async validateChoice(
    client: PoolClient,
    campaignId: string,
    choice: Choice,
  ) {
    requireUuid(choice.optionId);
    if (!/^\d{5}$/.test(choice.municipalityCode))
      throw new ParticipationError("INVALID_MUNICIPALITY");
    const result = await client.query(
      `SELECT 1 FROM reference.municipalities m JOIN catalog.option_provinces o ON o.province_code=m.province_code WHERE m.ine_code=$1 AND o.campaign_id=$2 AND o.option_id=$3`,
      [choice.municipalityCode, campaignId, choice.optionId],
    );
    if (!result.rowCount) throw new ParticipationError("OPTION_NOT_AVAILABLE");
  }
  private async delta(
    client: PoolClient,
    campaignId: string,
    choice: Choice,
    amount: 1 | -1,
  ) {
    if (amount === 1) {
      await client.query(
        `INSERT INTO aggregation_private.counts(campaign_id,municipality_code,option_id,responses) VALUES($1,$2,$3,1) ON CONFLICT(campaign_id,municipality_code,option_id) DO UPDATE SET responses=aggregation_private.counts.responses+1`,
        [campaignId, choice.municipalityCode, choice.optionId],
      );
    } else {
      const result = await client.query(
        `UPDATE aggregation_private.counts SET responses=responses-1 WHERE campaign_id=$1 AND municipality_code=$2 AND option_id=$3 AND responses>0`,
        [campaignId, choice.municipalityCode, choice.optionId],
      );
      if (!result.rowCount) throw new ParticipationError("INTEGRITY_ERROR");
    }
  }
  async issueToken(campaignId: string) {
    const token = privateSecret();
    await transaction(this.pool, async (client) => {
      await this.campaign(client, campaignId);
      await client.query(
        `INSERT INTO authorization_private.one_time_tokens(digest,campaign_id,expires_at) VALUES($1,$2,now()+interval '15 minutes')`,
        [digest(this.hashKey, campaignId, token, "token"), campaignId],
      );
    });
    return token;
  }
  async submit(input: Submission) {
    validateSecret(input.token);
    validateSecret(input.credential);
    requireUuid(input.campaignId);
    if (input.explicitConsent !== true)
      throw new ParticipationError("EXPLICIT_CONSENT_REQUIRED");
    return transaction(this.pool, async (client) => {
      const campaign = await this.campaign(client, input.campaignId);
      if (campaign.consent_version !== input.consentVersion)
        throw new ParticipationError("CONSENT_VERSION_MISMATCH");
      await this.validateChoice(client, input.campaignId, input);
      const consumed = await client.query(
        `UPDATE authorization_private.one_time_tokens SET used_at=now() WHERE digest=$1 AND campaign_id=$2 AND used_at IS NULL AND expires_at>now() RETURNING digest`,
        [
          digest(this.hashKey, input.campaignId, input.token, "token"),
          input.campaignId,
        ],
      );
      if (!consumed.rowCount)
        throw new ParticipationError("TOKEN_INVALID_OR_USED");
      const credentialDigest = digest(
        this.hashKey,
        input.campaignId,
        input.credential,
        "credential",
      );
      const exists = await client.query(
        "SELECT 1 FROM authorization_private.credentials WHERE digest=$1",
        [credentialDigest],
      );
      if (exists.rowCount)
        throw new ParticipationError("CREDENTIAL_ALREADY_USED");
      const id = randomUUID();
      const choice = {
        municipalityCode: input.municipalityCode,
        optionId: input.optionId,
      };
      await client.query(
        "INSERT INTO participation_private.ballots(id,campaign_id,encrypted_payload) VALUES($1,$2,$3)",
        [
          id,
          input.campaignId,
          seal(this.encryptionKey, input.campaignId, id, choice),
        ],
      );
      await client.query(
        "INSERT INTO authorization_private.credentials(digest,campaign_id,ballot_id) VALUES($1,$2,$3)",
        [credentialDigest, input.campaignId, id],
      );
      await client.query(
        "INSERT INTO authorization_private.consents(credential_digest,version) VALUES($1,$2)",
        [credentialDigest, input.consentVersion],
      );
      await this.delta(client, input.campaignId, choice, 1);
      return { revision: 1 };
    });
  }
  async replace(
    input: Choice & {
      campaignId: string;
      credential: string;
      expectedRevision: number;
    },
  ) {
    validateSecret(input.credential);
    if (
      !Number.isSafeInteger(input.expectedRevision) ||
      input.expectedRevision < 1
    )
      throw new ParticipationError("INVALID_REVISION");
    return transaction(this.pool, async (client) => {
      await this.campaign(client, input.campaignId);
      await this.validateChoice(client, input.campaignId, input);
      const old = await this.authorizedBallot(
        client,
        input.campaignId,
        input.credential,
      );
      if (old.revision !== input.expectedRevision)
        throw new ParticipationError("REVISION_CONFLICT");
      const previous = unseal<Choice>(
        this.encryptionKey,
        input.campaignId,
        old.id,
        old.encrypted_payload,
      );
      const next = {
        municipalityCode: input.municipalityCode,
        optionId: input.optionId,
      };
      await this.delta(client, input.campaignId, previous, -1);
      await this.delta(client, input.campaignId, next, 1);
      await client.query(
        "UPDATE participation_private.ballots SET encrypted_payload=$1,revision=revision+1 WHERE id=$2",
        [seal(this.encryptionKey, input.campaignId, old.id, next), old.id],
      );
      return { revision: old.revision + 1 };
    });
  }
  private async authorizedBallot(
    client: PoolClient,
    campaignId: string,
    credential: string,
  ) {
    const result = await client.query(
      `SELECT b.* FROM participation_private.ballots b JOIN authorization_private.credentials c ON c.ballot_id=b.id AND c.campaign_id=b.campaign_id WHERE c.digest=$1 AND c.campaign_id=$2 FOR UPDATE OF b`,
      [digest(this.hashKey, campaignId, credential, "credential"), campaignId],
    );
    if (!result.rowCount) throw new ParticipationError("CREDENTIAL_NOT_FOUND");
    return result.rows[0];
  }
  async withdraw(campaignId: string, credential: string) {
    validateSecret(credential);
    return transaction(this.pool, async (client) => {
      await this.campaign(client, campaignId, true);
      const old = await this.authorizedBallot(client, campaignId, credential);
      const previous = unseal<Choice>(
        this.encryptionKey,
        campaignId,
        old.id,
        old.encrypted_payload,
      );
      await this.delta(client, campaignId, previous, -1);
      await client.query(
        "DELETE FROM participation_private.ballots WHERE id=$1",
        [old.id],
      );
      return { withdrawn: true };
    });
  }
}
