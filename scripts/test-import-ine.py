#!/usr/bin/env python3
"""Pruebas de importación con fuentes oficiales descargadas. No modifica el catálogo."""
import argparse, importlib.util, pathlib, shutil, tempfile, unittest
import openpyxl
parser=argparse.ArgumentParser();parser.add_argument('--source-dir',type=pathlib.Path,required=True);args=parser.parse_args()
spec=importlib.util.spec_from_file_location('import_ine',pathlib.Path(__file__).with_name('import-ine.py'));module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class ImportTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.path=pathlib.Path(self.tmp.name);self.sources=self.path/'source';self.sources.mkdir()
        for f in module.FILES:shutil.copy(args.source_dir/f,self.sources/f)
        self.output=self.path/'catalog.json';self.output.write_text('VERSION_ANTERIOR')
    def tearDown(self):self.tmp.cleanup()
    def test_valid_official_import(self):
        module.import_catalog(self.sources,self.output)
        import json
        data=json.loads(self.output.read_text());self.assertEqual(len(data['municipalities']),8132)
    def test_duplicate_code_does_not_replace_existing_catalog(self):
        path=self.sources/'26codmun.xlsx';wb=openpyxl.load_workbook(path);sheet=wb['01'];sheet['B5']=sheet['B4'].value;wb.save(path);wb.close()
        with self.assertRaisesRegex(ValueError,'duplicados'):module.import_catalog(self.sources,self.output)
        self.assertEqual(self.output.read_text(),'VERSION_ANTERIOR')
    def test_wrong_version_does_not_replace_existing_catalog(self):
        path=self.sources/'26codmun.xlsx';wb=openpyxl.load_workbook(path);wb['01']['A1']='Relación de municipios 2025';wb.save(path);wb.close()
        with self.assertRaisesRegex(ValueError,'Versión'):module.import_catalog(self.sources,self.output)
        self.assertEqual(self.output.read_text(),'VERSION_ANTERIOR')
    def test_wrong_province_count_is_rejected(self):
        path=self.sources/'cod_num_muni_provincia_ccaa.htm';data=path.read_text(encoding='iso-8859-15');self.assertIn('8.132',data);path.write_text(data.replace('8.132','8.131'),encoding='iso-8859-15')
        with self.assertRaises(ValueError):module.import_catalog(self.sources,self.output)
        self.assertEqual(self.output.read_text(),'VERSION_ANTERIOR')
unittest.main(argv=['test-import-ine.py'])
