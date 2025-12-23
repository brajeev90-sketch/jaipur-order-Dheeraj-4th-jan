import { useState, useEffect, useRef } from 'react';
import { factoriesApi, templatesApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Building2, Plus, Trash2, Edit, FileSpreadsheet, Upload, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

export default function FactoryManagement() {
  const { t } = useLanguage();
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [factoryToDelete, setFactoryToDelete] = useState(null);
  const [editingFactory, setEditingFactory] = useState(null);
  const [formData, setFormData] = useState({ code: '', name: '' });
  const excelInputRef = useRef(null);

  useEffect(() => {
    loadFactories();
  }, []);

  const loadFactories = async () => {
    try {
      const response = await factoriesApi.getAll();
      setFactories(response.data);
    } catch (error) {
      console.error('Error loading factories:', error);
      toast.error(t('failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (factory = null) => {
    if (factory) {
      setFormData({ code: factory.code, name: factory.name });
      setEditingFactory(factory);
    } else {
      setFormData({ code: '', name: '' });
      setEditingFactory(null);
    }
    setDialogOpen(true);
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error(t('invalidFileType'));
      return;
    }
    setUploading(true);
    setUploadResult(null);
    try {
      const response = await factoriesApi.uploadExcel(file);
      setUploadResult(response.data);
      toast.success(`${response.data.created} ${t('factoriesImported')}`);
      loadFactories();
    } catch (error) {
      console.error('Error uploading:', error);
      toast.error(t('uploadFailed'));
      setUploadResult({ error: error.message });
    } finally {
      setUploading(false);
      if (excelInputRef.current) excelInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!formData.code || !formData.name) {
      toast.error(t('codeNameRequired'));
      return;
    }

    try {
      if (editingFactory) {
        await factoriesApi.delete(editingFactory.id);
        const response = await factoriesApi.create(formData);
        setFactories(factories.map(f => f.id === editingFactory.id ? response.data : f));
        toast.success(t('factoryUpdated'));
      } else {
        const response = await factoriesApi.create(formData);
        setFactories([...factories, response.data]);
        toast.success(t('factoryAdded'));
      }
      setDialogOpen(false);
      setFormData({ code: '', name: '' });
      setEditingFactory(null);
      loadFactories();
    } catch (error) {
      console.error('Error saving factory:', error);
      toast.error(t('failedToSave'));
    }
  };

  const handleDelete = async () => {
    if (!factoryToDelete) return;

    try {
      await factoriesApi.delete(factoryToDelete.id);
      setFactories(factories.filter(f => f.id !== factoryToDelete.id));
      toast.success(t('factoryDeleted'));
    } catch (error) {
      console.error('Error deleting factory:', error);
      toast.error(t('failedToDeleteFactory'));
    } finally {
      setDeleteDialogOpen(false);
      setFactoryToDelete(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="loading-spinner"></div></div>;
  }

  return (
    <div className="animate-fade-in" data-testid="factory-management-page">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3" data-testid="factory-title">
            <Building2 size={28} />
            {t('factoryManagementTitle')}
          </h1>
          <p className="page-description">{t('factoryManagementDesc')}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="gap-2 flex-1 sm:flex-none" onClick={() => setUploadDialogOpen(true)} data-testid="bulk-upload-btn">
            <FileSpreadsheet size={18} />
            {t('bulkUpload')}
          </Button>
          <Button className="gap-2 flex-1 sm:flex-none" onClick={() => openDialog()} data-testid="add-factory-btn">
            <Plus size={18} />
            {t('addFactory')}
          </Button>
        </div>
      </div>

      {/* Factories Grid */}
      {factories.length === 0 ? (
        <Card data-testid="empty-factories">
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto text-muted-foreground mb-4" size={48} />
            <p className="text-muted-foreground mb-4">{t('noFactoriesYet')}</p>
            <Button variant="outline" onClick={() => openDialog()}>
              {t('addFirstFactory')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="factories-grid">
          {factories.map((factory) => (
            <Card key={factory.id} className="card-hover" data-testid={`factory-card-${factory.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-sm bg-primary/10">
                      <Building2 className="text-primary" size={24} />
                    </div>
                    <div>
                      <Badge variant="outline" className="font-mono text-base mb-1">{factory.code}</Badge>
                      <p className="text-sm text-muted-foreground">{factory.name}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(factory)} data-testid={`edit-factory-${factory.id}`}><Edit size={16} /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => { setFactoryToDelete(factory); setDeleteDialogOpen(true); }} data-testid={`delete-factory-${factory.id}`}><Trash2 size={16} /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Factory Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">{editingFactory ? t('editFactory') : t('addNewFactory')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('factoryCode')}</Label>
              <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="e.g., SAE" className="font-mono text-lg" maxLength={5} data-testid="factory-code-input" />
              <p className="text-xs text-muted-foreground">{t('factoryCodeDesc')}</p>
            </div>
            <div className="space-y-2">
              <Label>{t('factoryName')}</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Shekhawati Art Exports" data-testid="factory-name-input" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel')}</Button>
              <Button onClick={handleSubmit} data-testid="save-factory-btn">{editingFactory ? t('update') : t('add')} {t('factory')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteFactory')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteFactoryConfirm')} "{factoryToDelete?.code} - {factoryToDelete?.name}"? {t('cannotUndo')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-serif text-xl flex items-center gap-2"><FileSpreadsheet size={24} />{t('bulkUploadFactories')}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {/* Download Sample */}
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-blue-800">{t('downloadSampleFirst')}</p>
                <p className="text-xs text-blue-600">{t('downloadSampleDesc')}</p>
              </div>
              <a href={templatesApi.factoriesSample()} download>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download size={16} />
                  {t('downloadSample')}
                </Button>
              </a>
            </div>
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-medium text-sm">{t('excelFormat')}</h4>
              <p className="text-xs text-muted-foreground">{t('excelFormatDescFactory')}</p>
              <div className="text-xs text-muted-foreground mt-2">
                <p className="font-medium mb-1">{t('supportedColumns')}:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Code / Factory Code</li>
                  <li>Name / Factory Name</li>
                </ul>
              </div>
            </div>
            <div className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${uploading ? 'bg-muted' : 'hover:bg-muted/50'}`} onClick={() => !uploading && excelInputRef.current?.click()}>
              {uploading ? (
                <div className="flex flex-col items-center"><div className="loading-spinner mb-2"></div><p className="text-sm text-muted-foreground">{t('uploadingItems')}</p></div>
              ) : (
                <><Upload size={40} className="mx-auto text-muted-foreground mb-3" /><p className="text-sm font-medium mb-1">{t('clickToUpload')}</p><p className="text-xs text-muted-foreground">{t('supportedFormat')}: .xlsx, .xls</p></>
              )}
            </div>
            <input ref={excelInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload} />
            {uploadResult && !uploadResult.error && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">{t('uploadSuccess')}</h4>
                <p className="text-sm text-green-700">✓ {uploadResult.created} {t('factoriesCreated')}</p>
                {uploadResult.items?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <div className="flex flex-wrap gap-1">
                      {uploadResult.items.slice(0, 10).map((p, idx) => <Badge key={idx} variant="secondary" className="text-xs">{p.code}</Badge>)}
                      {uploadResult.items.length > 10 && <Badge variant="outline" className="text-xs">+{uploadResult.items.length - 10} {t('more')}</Badge>}
                    </div>
                  </div>
                )}
              </div>
            )}
            {uploadResult?.error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg"><h4 className="font-medium text-red-800 mb-1">{t('uploadError')}</h4><p className="text-sm text-red-700">{uploadResult.error}</p></div>}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => { setUploadDialogOpen(false); setUploadResult(null); }}>{t('close')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
