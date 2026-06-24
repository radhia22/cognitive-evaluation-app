import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy,
  Timestamp,
  doc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Patient, TestAssignment, TestResult, TestType } from '../types';

export const dbService = {
  // Patients
  async createPatient(doctorId: string, data: Omit<Patient, 'id' | 'doctorId' | 'createdAt'>) {
    const path = 'patients';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...data,
        doctorId,
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async getPatients(doctorId: string) {
    const path = 'patients';
    try {
      const q = query(
        collection(db, path), 
        where('doctorId', '==', doctorId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Patient));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  // Assignments
  async assignTests(patientId: string, doctorId: string, testIds: TestType[]) {
    const path = 'assignments';
    try {
      const docRef = await addDoc(collection(db, path), {
        patientId,
        doctorId,
        testIds,
        status: 'pending',
        assignedAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async getAssignments(patientId: string, doctorId: string) {
    const path = 'assignments';
    try {
      const q = query(
        collection(db, path),
        where('patientId', '==', patientId),
        where('doctorId', '==', doctorId),
        orderBy('assignedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TestAssignment));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  // Results
  async saveTestResult(data: Omit<TestResult, 'id' | 'createdAt'>) {
    const path = 'testResults';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...data,
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getResults(patientId: string, doctorId: string) {
    const path = 'testResults';
    try {
      const q = query(
        collection(db, path),
        where('patientId', '==', patientId),
        where('doctorId', '==', doctorId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TestResult));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async deletePatient(patientId: string) {
    const path = `patients/${patientId}`;
    try {
      await deleteDoc(doc(db, 'patients', patientId));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};
