import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Save, Palette, DollarSign, Type, Image as ImageIcon, Mail, RefreshCw, Upload, X } from 'lucide-react';

interface AppSettings {
  id: string;
  app_name: string;
  app_tagline: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  hero_image_url: string | null;
  welcome_message: string;
  annual_price: number;
  lifetime_price: number;
  footer_text: string;
  contact_email: string | null;
  enable_public_registration: boolean;
}

export function AdminSettings() {
  const { profile, refreshSettings } = useAuth();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);

  useEffect(() => {
    if (profile?.is_admin) {
      loadSettings();
    }
  }, [profile]);

  const loadSettings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('app_settings')
      .select('*')
      .maybeSingle();

    if (data) {
      setSettings(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!settings || !profile) return;

    setSaving(true);
    setSaveMessage('');

    const { error } = await supabase
      .from('app_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
        updated_by: profile.id,
      })
      .eq('id', settings.id);

    setSaving(false);

    if (error) {
      setSaveMessage('Error saving settings. Please try again.');
    } else {
      setSaveMessage('Settings saved successfully!');
      await refreshSettings();
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const updateSetting = (key: keyof AppSettings, value: string | number | boolean) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const uploadImage = async (file: File, type: 'logo' | 'hero') => {
    if (!profile) return;

    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingHero;
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('app-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('app-images')
        .getPublicUrl(filePath);

      if (type === 'logo') {
        updateSetting('logo_url', publicUrl);
      } else {
        updateSetting('hero_image_url', publicUrl);
      }

      setSaveMessage(`${type === 'logo' ? 'Logo' : 'Hero image'} uploaded! Remember to click "Save Changes" to apply.`);
      setTimeout(() => setSaveMessage(''), 5000);
    } catch (error) {
      setSaveMessage(`Error uploading ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'hero') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSaveMessage('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSaveMessage('File size must be less than 5MB');
      return;
    }

    uploadImage(file, type);
  };

  if (!profile?.is_admin) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
        <p className="text-center text-gray-600">You do not have admin permissions.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
        <p className="text-center text-gray-600">Loading settings...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
        <p className="text-center text-gray-600">Settings not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Application Settings</h2>
          <div className="flex gap-2">
            <button
              onClick={loadSettings}
              disabled={loading}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-2 rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {saveMessage && (
          <div className={`mb-6 p-4 rounded-lg ${saveMessage.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {saveMessage}
          </div>
        )}

        <div className="space-y-8">
          <section>
            <div className="flex items-center mb-4">
              <Type className="w-5 h-5 text-orange-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Branding</h3>
            </div>
            <div className="space-y-4 pl-7">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Name
                </label>
                <input
                  type="text"
                  value={settings.app_name}
                  onChange={(e) => updateSetting('app_name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Raceline"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tagline
                </label>
                <input
                  type="text"
                  value={settings.app_tagline}
                  onChange={(e) => updateSetting('app_tagline', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Connect with owners, shareholders, and trainers"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Footer Text
                </label>
                <input
                  type="text"
                  value={settings.footer_text}
                  onChange={(e) => updateSetting('footer_text', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="© 2024 Raceline"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center mb-4">
              <Palette className="w-5 h-5 text-orange-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Colors</h3>
            </div>
            <div className="space-y-4 pl-7">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.primary_color}
                    onChange={(e) => updateSetting('primary_color', e.target.value)}
                    className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.primary_color}
                    onChange={(e) => updateSetting('primary_color', e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
                    placeholder="#2563eb"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.secondary_color}
                    onChange={(e) => updateSetting('secondary_color', e.target.value)}
                    className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.secondary_color}
                    onChange={(e) => updateSetting('secondary_color', e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center mb-4">
              <ImageIcon className="w-5 h-5 text-orange-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Images</h3>
            </div>
            <div className="space-y-6 pl-7">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo
                </label>

                {settings.logo_url && (
                  <div className="mb-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Current Logo</span>
                      <button
                        onClick={() => updateSetting('logo_url', '')}
                        className="text-red-600 hover:text-red-700 p-1"
                        title="Remove logo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <img
                      src={settings.logo_url}
                      alt="Logo preview"
                      className="max-h-20 object-contain bg-white p-2 rounded border border-gray-200"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'logo')}
                      className="hidden"
                      disabled={uploadingLogo}
                    />
                    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer">
                      <Upload className="w-4 h-4" />
                      {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    </div>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Upload an image file (max 5MB). Supports JPG, PNG, GIF, WebP.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Image
                </label>

                {settings.hero_image_url && (
                  <div className="mb-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Current Background</span>
                      <button
                        onClick={() => updateSetting('hero_image_url', '')}
                        className="text-red-600 hover:text-red-700 p-1"
                        title="Remove background"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <img
                      src={settings.hero_image_url}
                      alt="Background preview"
                      className="max-h-32 w-full object-cover rounded border border-gray-200"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'hero')}
                      className="hidden"
                      disabled={uploadingHero}
                    />
                    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer">
                      <Upload className="w-4 h-4" />
                      {uploadingHero ? 'Uploading...' : 'Upload Background'}
                    </div>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Upload a background image for the login page (max 5MB).
                </p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center mb-4">
              <DollarSign className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Membership Pricing</h3>
            </div>
            <div className="space-y-4 pl-7">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Membership Price (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.annual_price}
                  onChange={(e) => updateSetting('annual_price', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="5.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lifetime Membership Price (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.lifetime_price}
                  onChange={(e) => updateSetting('lifetime_price', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="10.00"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center mb-4">
              <Mail className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Contact & Messages</h3>
            </div>
            <div className="space-y-4 pl-7">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={settings.contact_email || ''}
                  onChange={(e) => updateSetting('contact_email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="contact@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Welcome Message
                </label>
                <textarea
                  value={settings.welcome_message}
                  onChange={(e) => updateSetting('welcome_message', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Welcome to our exclusive racing community!"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="space-y-4 pl-7">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enable_public_registration"
                  checked={settings.enable_public_registration}
                  onChange={(e) => updateSetting('enable_public_registration', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="enable_public_registration" className="ml-2 text-sm font-medium text-gray-700">
                  Enable public registration (allow anyone to sign up)
                </label>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
