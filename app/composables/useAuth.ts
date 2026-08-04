export interface AuthUser {
  name: string;
}

const STORAGE_KEY = "av_user";

export function useAuth() {
  const user = useState<AuthUser | null>("av-user", () => null);

  if (import.meta.client) {
    onMounted(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) user.value = JSON.parse(raw);
      } catch {
        user.value = null;
      }
    });
  }

  const login = (u: AuthUser | null) => {
    user.value = u;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } catch {}
  };

  const signOut = () => {
    user.value = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return { user, login, signOut };
}
