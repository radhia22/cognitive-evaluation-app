export type Language = 'ar' | 'fr';

export interface Doctor {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Patient {
  id: string;
  doctorId: string;
  name: string;
  age: number;
  injuryType: string;
  createdAt: string;
}

export interface TestAssignment {
  id: string;
  patientId: string;
  doctorId: string; // Added for security
  testIds: TestType[];
  status: 'pending' | 'completed';
  assignedAt: string;
  completedAt?: string;
}

export type TestType = 
  | 'selective_attention'
  | 'central_verbal_shadowing'
  | 'central_stroop_test'
  | 'digit_span'
  | 'phonological_story_creation'
  | 'phonological_similarity'
  | 'matrix_memory'
  | 'mental_map'
  | 'visual_discrimination'
  | 'go_no_go'
  | 'task_switching'
  | 'reverse_direction';

export interface TestMetrics {
  averageReactionTime: number; // in ms
  errorCount: number;
  correctCount: number;
  accuracy: number; // 0 to 1
}

export interface TestResult {
  id: string;
  assignmentId: string;
  patientId: string;
  doctorId: string; // Added for security
  testType: TestType;
  metrics: TestMetrics;
  rawData: any[];
  createdAt: string;
}

export interface Translation {
  title: string;
  doctorDashboard: string;
  patientInterface: string;
  addPatient: string;
  assignTests: string;
  viewReports: string;
  startTest: string;
  loading: string;
  logout: string;
  // Test specific
  go: string;
  noGo: string;
  correct: string;
  wrong: string;
  // ... and many more
}
