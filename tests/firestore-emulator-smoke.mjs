import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { connectFirestoreEmulator, deleteDoc, doc, getDoc, getFirestore, setDoc, terminate } from 'firebase/firestore';

const projectId = 'demo-gta-security-check';
const hostPort = process.env.FIRESTORE_EMULATOR_HOST;
assert.ok(hostPort, 'Only run against FIRESTORE_EMULATOR_HOST, never live Firestore');
const [host, portText] = hostPort.split(':');
const port = Number(portText);
assert.ok(['127.0.0.1', 'localhost'].includes(host) && port > 0, 'Refusing non-local emulator host');

const app = initializeApp({ projectId, apiKey: 'fake-demo-only', appId: 'demo-app-id' }, `smoke-${process.pid}`);
const database = getFirestore(app);
connectFirestoreEmulator(database, host, port);
const ref = doc(database, 'integration_smoke', `grpc-${process.pid}`);
try {
  await setDoc(ref, { valid: true, source: 'local-grpc-override-test' });
  const snapshot = await getDoc(ref);
  assert.equal(snapshot.exists(), true);
  assert.equal(snapshot.data()?.source, 'local-grpc-override-test');
  await deleteDoc(ref);
  assert.equal((await getDoc(ref)).exists(), false);
  console.log('LOCAL_FIRESTORE_EMULATOR_READ_WRITE_DELETE_PASS');
} finally {
  await terminate(database);
  await deleteApp(app);
}
