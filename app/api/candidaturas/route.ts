import { isLiveVoteConfigured } from "../../../lib/server/live-vote-configuration.ts";
import {
  candidaciesForProvince,
  candidacyInfo,
} from "../../../lib/candidacies/registry.ts";
export function GET(request: Request) {
  const province = new URL(request.url).searchParams.get("provincia");
  if (
    !province ||
    !/^\d{2}$/.test(province) ||
    !candidaciesForProvince(province).length
  )
    return Response.json(
      { error: "Indica un código provincial INE válido." },
      { status: 400 },
    );
  return Response.json(
    {
      provinceCode: province,
      candidacies: candidaciesForProvince(province),
      asOf: candidacyInfo.asOf,
      participationEnabled: isLiveVoteConfigured(),
    },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
