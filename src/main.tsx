import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { supabase } from './lib/supabase';

function AppWithFavicon() {
  useEffect(() => {
    const updateFavicon = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('logo_url')
        .single();

      if (data?.logo_url) {
        const favicon = document.getElementById('favicon') as HTMLLinkElement;
        const appleTouchIcon = document.getElementById('apple-touch-icon') as HTMLLinkElement;

        if (favicon) {
          favicon.href = data.logo_url;
        }
        if (appleTouchIcon) {
          appleTouchIcon.href = data.logo_url;
        }
      }
    };

    updateFavicon();

    const channel = supabase
      .channel('app_settings_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_settings'
        },
        (payload) => {
          if (payload.new && 'logo_url' in payload.new) {
            const favicon = document.getElementById('favicon') as HTMLLinkElement;
            const appleTouchIcon = document.getElementById('apple-touch-icon') as HTMLLinkElement;

            if (favicon && payload.new.logo_url) {
              favicon.href = payload.new.logo_url as string;
            }
            if (appleTouchIcon && payload.new.logo_url) {
              appleTouchIcon.href = payload.new.logo_url as string;
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AppWithFavicon />
    </AuthProvider>
  </StrictMode>
);
