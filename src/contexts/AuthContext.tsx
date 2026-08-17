import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error);
        supabase.auth.signOut({ scope: 'local' }).catch(() => {});
        setSession(null);
        setUser(null);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const metadata = session.user.user_metadata;
          ensureProfileExists(
            session.user.id,
            session.user.email || '',
            metadata?.first_name,
            metadata?.last_name
          );
        }
      }
      setLoading(false);
    }).catch(async (error) => {
      console.error('Failed to get session:', error);
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      setSession(null);
      setUser(null);
      setLoading(false);
    });

    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const recoveryType = hashParams.get('type');
    if (recoveryType === 'recovery') {
      // password recovery flow
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // handled by reset password page
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        const metadata = session.user.user_metadata;
        ensureProfileExists(
          session.user.id,
          session.user.email || '',
          metadata?.first_name,
          metadata?.last_name
        );
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const ensureProfileExists = async (userId: string, userEmail: string, firstName?: string, lastName?: string) => {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!existingProfile) {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: userEmail,
          first_name: firstName || '',
          last_name: lastName || '',
        });

      if (error) {
        console.error('Error creating profile:', error);
      }
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      await ensureProfileExists(data.user.id, email, firstName, lastName);
    }
  };

  const signOut = async () => {
    localStorage.removeItem('sb-xtvmshymjewtfrtydtmc-auth-token');
    setSession(null);
    setUser(null);
  };

  const resetPasswordForEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, resetPasswordForEmail, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
