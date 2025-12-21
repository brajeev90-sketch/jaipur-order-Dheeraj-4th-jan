import { useState, useEffect } from 'react';
import { templateApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const defaultSettings = {
  id: 'default',
  company_name: 'JAIPUR – A fine wood furniture company',
  logo_text: 'JAIPUR',
  primary_color: '#3d2c1e',
  accent_color: '#d4622e',
  font_family: 'Playfair Display, serif',
  body_font: 'Manrope, sans-serif',
  page_margin_mm: 15,
  show_borders: true,
  header_height_mm: 25,
  footer_height_mm: 20,
};

export default function TemplateSettings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await templateApi.get();
      setSettings({ ...defaultSettings, ...response.data });
    } catch (error) {
      console.error('Error loading template settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await templateApi.update(settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    toast.info('Settings reset to defaults (not saved)');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="template-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-3xl" data-testid="template-settings-page">
      {/* Header */}
      <div className="page-header flex justify-between items-start">
        <div>
          <h1 className="page-title" data-testid="template-title">Template Settings</h1>
          <p className="page-description">Customize your PDF and PPT export templates</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleReset}
            data-testid="reset-btn"
          >
            <RotateCcw size={18} />
            Reset to Default
          </Button>
          <Button 
            className="gap-2"
            onClick={handleSave}
            disabled={saving}
            data-testid="save-settings-btn"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Branding */}
      <Card className="mb-6" data-testid="branding-card">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Branding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Logo Text</Label>
              <Input
                value={settings.logo_text}
                onChange={(e) => handleInputChange('logo_text', e.target.value)}
                placeholder="JAIPUR"
                className="font-serif text-lg"
                data-testid="logo-text-input"
              />
              <p className="text-xs text-muted-foreground">
                This text appears as the logo in exports
              </p>
            </div>
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                value={settings.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="Company name"
                data-testid="company-name-input"
              />
              <p className="text-xs text-muted-foreground">
                Appears below the logo
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                  className="w-16 h-10 p-1"
                  data-testid="primary-color-input"
                />
                <Input
                  value={settings.primary_color}
                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                  className="font-mono"
                  data-testid="primary-color-text"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Used for headers, titles, and table headers
              </p>
            </div>
            <div className="space-y-2">
              <Label>Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.accent_color}
                  onChange={(e) => handleInputChange('accent_color', e.target.value)}
                  className="w-16 h-10 p-1"
                  data-testid="accent-color-input"
                />
                <Input
                  value={settings.accent_color}
                  onChange={(e) => handleInputChange('accent_color', e.target.value)}
                  className="font-mono"
                  data-testid="accent-color-text"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Used for highlights and accents
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card className="mb-6" data-testid="typography-card">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Typography</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Heading Font</Label>
              <Input
                value={settings.font_family}
                onChange={(e) => handleInputChange('font_family', e.target.value)}
                placeholder="Playfair Display, serif"
                data-testid="heading-font-input"
              />
              <p className="text-xs text-muted-foreground">
                CSS font-family for headings
              </p>
            </div>
            <div className="space-y-2">
              <Label>Body Font</Label>
              <Input
                value={settings.body_font}
                onChange={(e) => handleInputChange('body_font', e.target.value)}
                placeholder="Manrope, sans-serif"
                data-testid="body-font-input"
              />
              <p className="text-xs text-muted-foreground">
                CSS font-family for body text
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Page Layout */}
      <Card className="mb-6" data-testid="layout-card">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Page Layout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Page Margin (mm)</Label>
              <Input
                type="number"
                min="5"
                max="30"
                value={settings.page_margin_mm}
                onChange={(e) => handleInputChange('page_margin_mm', parseInt(e.target.value) || 15)}
                data-testid="page-margin-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Header Height (mm)</Label>
              <Input
                type="number"
                min="15"
                max="50"
                value={settings.header_height_mm}
                onChange={(e) => handleInputChange('header_height_mm', parseInt(e.target.value) || 25)}
                data-testid="header-height-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Footer Height (mm)</Label>
              <Input
                type="number"
                min="10"
                max="30"
                value={settings.footer_height_mm}
                onChange={(e) => handleInputChange('footer_height_mm', parseInt(e.target.value) || 20)}
                data-testid="footer-height-input"
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Show Table Borders</Label>
              <p className="text-xs text-muted-foreground">
                Display borders around table cells in exports
              </p>
            </div>
            <Switch
              checked={settings.show_borders}
              onCheckedChange={(checked) => handleInputChange('show_borders', checked)}
              data-testid="show-borders-switch"
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card data-testid="preview-card">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="border rounded-sm p-6 bg-white"
            style={{ fontFamily: settings.body_font }}
          >
            <div className="flex justify-between items-start pb-4 border-b-2" style={{ borderColor: settings.primary_color }}>
              <div>
                <h1 
                  className="text-2xl font-semibold"
                  style={{ fontFamily: settings.font_family, color: settings.primary_color }}
                >
                  {settings.logo_text}
                </h1>
                <p className="text-xs text-muted-foreground">{settings.company_name}</p>
              </div>
              <div className="text-xs text-right">
                <div className="px-2 py-1 rounded" style={{ backgroundColor: settings.primary_color, color: 'white' }}>
                  Entry Date: 2024-01-15
                </div>
              </div>
            </div>
            <div className="mt-4 text-sm">
              <p>This is a preview of how your exports will look with the current settings.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
