import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../app/api';

export function useStudentResults(studentId: string) {
  return useQuery({
    queryKey: ['results', studentId],
    queryFn: async () => {
      // Try exam service first (published results)
      try {
        const res = await api.get(`/exams/results/${studentId}`);
        if (res.data?.data?.marks?.length) return res.data.data;
      } catch { /* fall through */ }

      // Fall back to academic history from student service
      const histRes = await api.get(`/students/${studentId}/academic-history`);
      const rows: Array<{
        semester: number; subject_code: string; subject_name: string;
        internal_marks: number; semester_marks: number; total_marks: number;
        grade: string; gpa: number; is_backlog: boolean;
      }> = histRes.data?.data ?? [];

      // Shape data to match exam service format
      const marks = rows.map(r => ({
        semester: r.semester,
        subject_code: r.subject_code,
        subject_name: r.subject_name,
        internal_marks: r.internal_marks,
        semester_marks: r.semester_marks,
        total_marks: r.total_marks,
        grade: r.grade,
        gpa_points: r.gpa,
        is_backlog: r.is_backlog,
      }));

      // Calculate semester GPA averages
      const semGPA: Record<number, number> = {};
      const semGroups: Record<number, number[]> = {};
      marks.forEach(m => {
        if (!semGroups[m.semester]) semGroups[m.semester] = [];
        semGroups[m.semester].push(m.gpa_points);
      });
      Object.entries(semGroups).forEach(([sem, gpas]) => {
        semGPA[parseInt(sem)] = parseFloat((gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2));
      });

      return {
        marks,
        semesterGPA: semGPA,
        backlogs: marks.filter(m => m.is_backlog),
      };
    },
    enabled: !!studentId,
  });
}

export function useExamSchedules() {
  return useQuery({
    queryKey: ['exam-schedules'],
    queryFn: () => api.get('/exams/schedules').then(r => r.data.data),
  });
}

export function useGenerateHallTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { studentId: string; examCycle: string }) =>
      api.post('/exams/hall-tickets/generate', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hall-ticket'] }),
  });
}

export function usePublishResults() {
  return useMutation({
    mutationFn: (data: { semester: number; academicYear: string }) =>
      api.post('/exams/results/publish', data).then(r => r.data),
  });
}
