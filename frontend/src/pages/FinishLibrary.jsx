import { useState, useEffect } from 'react';
import { finishApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
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
import { Plus, Edit, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export default function FinishLibrary() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    color: '',
    image: '',
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const response = await finishApi.getAll();
      setItems(response.data);
    } catch (error) {
      console.error('Error loading finish library:', error);
      toast.error('Failed to load finish library');
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (item = null) => {
    if (item) {
      setFormData({
        code: item.code,
        name: item.name,
        description: item.description || '',
        color: item.color || '',
        image: item.image || '',
      });
      setEditingItem(item);
    } else {
      setFormData({
        code: '',
        name: '',
        description: '',
        color: '',
        image: '',
      });
      setEditingItem(null);
    }
    setDialogOpen(true);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData(prev => ({ ...prev, image: e.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
  };

  const handleSubmit = async () => {
    if (!formData.code || !formData.name) {
      toast.error('Code and Name are required');
      return;
    }

    try {
      if (editingItem) {
        await finishApi.update(editingItem.id, {
          ...formData,
          id: editingItem.id,
          created_at: editingItem.created_at,
        });
        setItems(items.map(i => i.id === editingItem.id ? { ...i, ...formData } : i));
        toast.success('Finish item updated');
      } else {
        const newItem = {
          ...formData,
          id: uuidv4(),
          created_at: new Date().toISOString(),
        };
        await finishApi.create(newItem);
        setItems([...items, newItem]);
        toast.success('Finish item created');
      }
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item');
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await finishApi.delete(itemToDelete.id);
      setItems(items.filter(i => i.id !== itemToDelete.id));
      toast.success('Finish item deleted');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="finish-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" data-testid="finish-library-page">
      {/* Header */}
      <div className="page-header flex justify-between items-start">
        <div>
          <h1 className="page-title" data-testid="finish-title">Finish Library</h1>
          <p className="page-description">Manage your finish codes and materials</p>
        </div>
        <Button 
          className="gap-2" 
          onClick={() => openDialog()}
          data-testid="add-finish-btn"
        >
          <Plus size={18} />
          Add Finish
        </Button>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <Card data-testid="empty-finish">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No finish items yet</p>
            <Button variant="outline" onClick={() => openDialog()}>
              Add First Finish
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="finish-grid">
          {items.map((item) => (
            <Card 
              key={item.id} 
              className="card-hover overflow-hidden"
              data-testid={`finish-card-${item.id}`}
            >
              {item.image ? (
                <div className="h-40 overflow-hidden">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div 
                  className="h-40 flex items-center justify-center"
                  style={{ backgroundColor: item.color || '#d4a574' }}
                >
                  <span className="text-4xl font-serif font-bold text-white/80">
                    {item.code.charAt(0)}
                  </span>
                </div>
              )}
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-mono font-medium">{item.code}</p>
                    <p className="text-sm text-muted-foreground">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => openDialog(item)}
                      data-testid={`edit-finish-${item.id}`}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setItemToDelete(item);
                        setDeleteDialogOpen(true);
                      }}
                      data-testid={`delete-finish-${item.id}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {editingItem ? 'Edit Finish' : 'Add New Finish'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  placeholder="FIN-001"
                  className="font-mono"
                  data-testid="finish-code-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Input
                  type="color"
                  value={formData.color || '#d4a574'}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  className="h-10 p-1"
                  data-testid="finish-color-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Antique Brass"
                data-testid="finish-name-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the finish..."
                rows={2}
                data-testid="finish-description-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Image</Label>
              {formData.image ? (
                <div className="relative">
                  <img 
                    src={formData.image} 
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-sm border"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1"
                    data-testid="remove-finish-image"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="image-upload-zone block cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    data-testid="finish-image-upload"
                  />
                  <Upload className="mx-auto mb-2 text-muted-foreground" size={24} />
                  <p className="text-xs text-muted-foreground">Click to upload</p>
                </label>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                data-testid="cancel-finish-btn"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                data-testid="save-finish-btn"
              >
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Finish Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-finish">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-delete-finish"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
