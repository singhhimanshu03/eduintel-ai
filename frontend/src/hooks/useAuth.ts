import { useSelector } from 'react-redux';
import { RootState } from '../app/store';

export function useAuth() {
  return useSelector((s: RootState) => s.auth);
}
