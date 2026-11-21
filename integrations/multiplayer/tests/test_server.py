import os,tempfile,threading,unittest,json,urllib.request,urllib.error
os.environ['DW_WORLD_DB']=os.path.join(tempfile.mkdtemp(),'world.sqlite')
from integrations.multiplayer.server import Handler,ThreadingHTTPServer
class RelayTest(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=cls.server.serve_forever,daemon=True).start();cls.url='http://127.0.0.1:%s/dangerouswaters-worlds/sync'%cls.server.server_port
 @classmethod
 def tearDownClass(cls): cls.server.shutdown();cls.server.server_close()
 def post(self,room,token,create=False):
  state={'name':'Tester','boat':'nordvind','x':1,'y':2,'heading':0,'hour':6,'landed':4,'earned':5,'pots':[{'x':5,'y':6,'id':1}],'berth':{'x':11,'y':22}};request=urllib.request.Request(self.url,data=json.dumps({'room':room,'token':token,'create':create,'state':state}).encode(),headers={'Content-Type':'application/json'});return json.load(urllib.request.urlopen(request))
 def test_two_clients_see_each_other_and_tokens_are_private(self):
  self.assertEqual(self.post('ABC123','a'*32,True)['players'],[]);seen=self.post('ABC123','b'*32)['players'];self.assertEqual(seen[0]['name'],'Tester');self.assertNotIn('token',seen[0]);self.assertEqual(seen[0]['berth']['x'],11);self.assertEqual(len(self.post('ABC123','a'*32)['players']),1)
 def test_simultaneous_berth_claim_is_rejected(self):
  first=self.post('BERTH1','d'*32,True);second=self.post('BERTH1','e'*32)
  self.assertFalse(first['berthConflict']);self.assertTrue(second['berthConflict'])
  self.assertFalse(self.post('BERTH1','d'*32)['berthConflict'])
 def test_missing_room_fails(self):
  with self.assertRaises(urllib.error.HTTPError) as e:self.post('ZZZ999','c'*32)
  self.assertEqual(e.exception.code,404)
