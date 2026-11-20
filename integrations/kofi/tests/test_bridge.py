import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('bridge', Path(__file__).resolve().parents[1]/'bridge.py')
bridge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bridge)

class BridgeTests(unittest.TestCase):
    def event(self, **changes):
        return dict(verification_token='test-secret',message_id='test-1',type='Tip',amount='5.00',currency='USD',is_public=True,from_name='Tester',message='Thanks!',email='private@example.invalid',**changes)
    def test_authentication(self):
        with self.assertRaises(PermissionError):
            bridge.normalize(self.event(), 'wrong')
    def test_private_message_and_identity_are_removed(self):
        data=self.event();data['is_public']=False
        _,event=bridge.normalize(data,'test-secret')
        self.assertEqual(event['message'],'');self.assertEqual(event['name'],'Anonymous supporter');self.assertIsNone(event['amount'])
        self.assertNotIn('email',event);self.assertNotIn('verification_token',event)
    def test_idempotence_and_initial_subscription(self):
        with tempfile.TemporaryDirectory() as root:
            store=bridge.Store(Path(root)/'events.db')
            message,event=bridge.normalize(self.event(),'test-secret')
            store.add(message,event);store.add(message,event)
            self.assertEqual(store.feed(),{'cursor':1,'events':[]})
            self.assertEqual(len(store.feed(0)['events']),1)
            self.assertEqual(store.feed(1)['events'],[])
            self.assertNotIn('test-secret',json.dumps(store.feed(0)))
    def test_invalid_amount(self):
        data=self.event();data['amount']='NaN'
        with self.assertRaises(ValueError):bridge.normalize(data,'test-secret')
    def test_actual_kofi_donation_payload_type(self):
        data=self.event();data['type']='Donation'
        self.assertIsNotNone(bridge.normalize(data,'test-secret'))
    def test_orders_are_not_donations(self):
        data=self.event();data['type']='Shop Order'
        self.assertIsNone(bridge.normalize(data,'test-secret'))

if __name__=='__main__':unittest.main()
