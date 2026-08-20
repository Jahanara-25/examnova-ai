export const studentProfile = {
  name: 'Aarav Sharma',
  role: 'Student',
  email: 'aarav@examnova.ai',
  branch: 'Computer Science',
  semester: '6th',
  rollNumber: 'CS-2048',
  cgpa: '8.9/10',
  avatar: 'AS',
};

export const studentStats = [
  { title: 'Upcoming Exams', value: '4', subtitle: '2 this week', icon: 'FaClipboardList', accent: 'from-blue-600 to-cyan-500' },
  { title: 'Attendance', value: '94%', subtitle: 'Excellent streak', icon: 'FaCalendarAlt', accent: 'from-violet-600 to-indigo-500' },
  { title: 'Average Score', value: '87%', subtitle: '+6% vs last term', icon: 'FaChartLine', accent: 'from-emerald-600 to-teal-500' },
  { title: 'Pending Tasks', value: '3', subtitle: '1 evaluation due', icon: 'FaTasks', accent: 'from-amber-500 to-orange-500' },
];

export const upcomingExams = [
  { id: 1, title: 'Operating Systems', date: 'Aug 14, 09:30', duration: '90 mins', venue: 'Lab 3', status: 'Scheduled' },
  { id: 2, title: 'Data Structures', date: 'Aug 16, 10:00', duration: '120 mins', venue: 'Room 12', status: 'Prep' },
  { id: 3, title: 'Machine Learning', date: 'Aug 19, 11:00', duration: '90 mins', venue: 'Seminar Hall', status: 'Scheduled' },
];

export const recentResults = [
  { subject: 'Database Management', score: '91%', rank: '2/148', date: 'Aug 01' },
  { subject: 'Software Engineering', score: '84%', rank: '14/148', date: 'Jul 29' },
  { subject: 'Discrete Math', score: '89%', rank: '7/148', date: 'Jul 24' },
];

export const analyticsData = [
  { name: 'Jan', score: 72 },
  { name: 'Feb', score: 76 },
  { name: 'Mar', score: 81 },
  { name: 'Apr', score: 78 },
  { name: 'May', score: 87 },
  { name: 'Jun', score: 89 },
];

export const subjectBreakdown = [
  { name: 'Math', value: 92 },
  { name: 'Science', value: 84 },
  { name: 'English', value: 88 },
  { name: 'CS', value: 95 },
];

export const examScheduleData = [
  { id: 1, title: 'Mid-Term Review', subject: 'Operating Systems', date: '2026-08-12', status: 'Upcoming', venue: 'Lab 3' },
  { id: 2, title: 'Practical Lab', subject: 'DBMS', date: '2026-08-14', status: 'Completed', venue: 'Lab 2' },
  { id: 3, title: 'Quiz', subject: 'ML', date: '2026-08-16', status: 'Missed', venue: 'Online' },
];

export const hallTicketData = {
  studentName: 'Aarav Sharma',
  rollNumber: 'CS-2048',
  examTitle: 'Semester End Examination',
  examDate: '2026-08-20',
  reportingTime: '08:30 AM',
  venue: 'Main Examination Center - Hall A',
  seatNumber: 'A-18',
};

export const resultsData = {
  overall: 87,
  rank: 12,
  correct: 35,
  wrong: 8,
  skipped: 2,
  subjectMarks: [
    { subject: 'OS', marks: 91 },
    { subject: 'DBMS', marks: 85 },
    { subject: 'ML', marks: 88 },
    { subject: 'DSA', marks: 84 },
  ],
};

export const certificates = [
  { id: 1, title: 'Excellence in Data Structures', issued: '2026-07-10', status: 'Ready' },
  { id: 2, title: 'AI Literacy Badge', issued: '2026-06-22', status: 'Published' },
];

export const notificationsData = [
  { id: 1, title: 'Exam Schedule Updated', detail: 'Operating Systems exam is shifted by 30 mins.', time: '2h ago' },
  { id: 2, title: 'Result Declared', detail: 'Database Management result is now available.', time: '1d ago' },
];

export const teacherProfile = {
  name: 'Dr. Meera Singh',
  role: 'Faculty',
  email: 'meera@examnova.ai',
  department: 'Computer Science',
  designation: 'Associate Professor',
  avatar: 'MS',
};

export const teacherStats = [
  { title: 'Active Exams', value: '8', subtitle: '2 launching today', icon: 'FaClipboardList', accent: 'from-indigo-600 to-blue-500' },
  { title: 'Questions Added', value: '1,240', subtitle: 'AI-assisted', icon: 'FaBookOpen', accent: 'from-violet-600 to-purple-500' },
  { title: 'Pending Review', value: '32', subtitle: '12 need urgent attention', icon: 'FaTasks', accent: 'from-amber-500 to-orange-500' },
  { title: 'Pass Rate', value: '91%', subtitle: 'Across current batch', icon: 'FaChartLine', accent: 'from-emerald-600 to-teal-500' },
];

export const teacherQuestions = [
  { id: 1, title: 'Binary Trees', subject: 'DSA', difficulty: 'Medium', status: 'Approved' },
  { id: 2, title: 'SQL Joins', subject: 'DBMS', difficulty: 'Easy', status: 'Draft' },
  { id: 3, title: 'Neural Networks', subject: 'ML', difficulty: 'Hard', status: 'Pending' },
];

export const teacherExams = [
  { id: 1, title: 'Semester End Exam', subject: 'Operating Systems', date: '2026-08-20', duration: '120 mins', status: 'Scheduled' },
  { id: 2, title: 'Mid Term Assessment', subject: 'DBMS', date: '2026-08-27', duration: '90 mins', status: 'Draft' },
];

export const studentManagementData = [
  { id: 1, name: 'Riya Kumar', batch: 'CSE-2024', performance: '91%', status: 'Active' },
  { id: 2, name: 'Vikram Rao', batch: 'CSE-2024', performance: '86%', status: 'At Risk' },
  { id: 3, name: 'Nisha Patel', batch: 'CSE-2024', performance: '94%', status: 'Active' },
];

export const evaluationQueue = [
  { id: 1, student: 'Riya Kumar', subject: 'ML', type: 'Descriptive', status: 'Pending' },
  { id: 2, student: 'Vikram Rao', subject: 'DSA', type: 'Coding', status: 'Review' },
];
