import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, factoriesApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { useLanguage } from '../contexts/LanguageContext';
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
import { 
  FileText, 
  Clock, 
  Factory, 
  CheckCircle,
  PlusCircle,
  ArrowRight,
  Building2,
  Plus,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

const statusColors = {
  'Draft': 'bg-yellow-100 text-yellow-800',
  'Submitted': 'bg-blue-100 text-blue-800',
  'In Production': 'bg-purple-100 text-purple-800',
  'Done': 'bg-green-100 text-green-800',
};

export default function Dashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    total_orders: 0,
    draft_orders: 0,
    in_production: 0,
    completed: 0,
    recent_orders: [],
  });
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [factoryDialogOpen, setFactoryDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [factoryToDelete, setFactoryToDelete] = useState(null);
  const [newFactory, setNewFactory] = useState({ code: '', name: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, factoriesRes] = await Promise.all([
        dashboardApi.getStats(),
        factoriesApi.getAll(),
      ]);
      setStats(statsRes.data);
      setFactories(factoriesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFactory = async () => {
    if (!newFactory.code || !newFactory.name) {
      toast.error('Code and Name are required');
      return;
    }

    try {
      const response = await factoriesApi.create(newFactory);
      setFactories([...factories, response.data]);
      setNewFactory({ code: '', name: '' });
      setFactoryDialogOpen(false);
      toast.success('Factory added successfully');
    } catch (error) {
      console.error('Error adding factory:', error);
      toast.error('Failed to add factory');
    }
  };

  const handleDeleteFactory = async () => {
    if (!factoryToDelete) return;

    try {
      await factoriesApi.delete(factoryToDelete.id);
      setFactories(factories.filter(f => f.id !== factoryToDelete.id));
      toast.success('Factory deleted successfully');
    } catch (error) {
      console.error('Error deleting factory:', error);
      toast.error('Failed to delete factory');
    } finally {
      setDeleteDialogOpen(false);
      setFactoryToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="dashboard-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" data-testid="dashboard-page">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="page-title" data-testid="dashboard-title">{t('dashboardTitle')}</h1>
          <p className="page-description">{t('dashboardDesc')}</p>
        </div>
        <Link to="/orders/new">
          <Button className="gap-2 w-full sm:w-auto" data-testid="create-order-btn">
            <PlusCircle size={18} />
            {t('newOrder')}
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-grid mb-8" data-testid="stats-grid">
        <Card className="stat-card" data-testid="stat-total">
          <CardContent className="p-0">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-sm bg-primary/10">
                <FileText className="text-primary" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('totalOrders')}</p>
                <p className="text-2xl font-semibold">{stats.total_orders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card" data-testid="stat-draft">
          <CardContent className="p-0">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-sm bg-yellow-100">
                <Clock className="text-yellow-700" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('drafts')}</p>
                <p className="text-2xl font-semibold">{stats.draft_orders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card" data-testid="stat-production">
          <CardContent className="p-0">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-sm bg-purple-100">
                <Factory className="text-purple-700" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('inProduction')}</p>
                <p className="text-2xl font-semibold">{stats.in_production}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card" data-testid="stat-completed">
          <CardContent className="p-0">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-sm bg-green-100">
                <CheckCircle className="text-green-700" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('completed')}</p>
                <p className="text-2xl font-semibold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card data-testid="recent-orders-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-serif text-xl">{t('recentOrders')}</CardTitle>
            <Link to="/orders">
              <Button variant="ghost" size="sm" className="gap-1">
                {t('viewAll')} <ArrowRight size={16} />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recent_orders.length === 0 ? (
              <div className="empty-state py-8" data-testid="empty-orders">
                <FileText className="empty-state-icon mx-auto" size={40} />
                <p className="text-muted-foreground">{t('noOrdersYet')}</p>
                <Link to="/orders/new">
                  <Button variant="outline" className="mt-4">
                    {t('createFirstOrder')}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3" data-testid="orders-list">
                {stats.recent_orders.map((order) => (
                  <Link
                    key={order.id}
                    to={`/orders/${order.id}`}
                    className="flex items-center justify-between p-3 rounded-sm border border-border hover:bg-muted/50 transition-colors"
                    data-testid={`order-item-${order.id}`}
                  >
                    <div>
                      <p className="font-medium font-mono text-sm">
                        {order.sales_order_ref || 'No Ref'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.buyer_name || 'No Buyer'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${statusColors[order.status] || 'bg-gray-100'} text-xs`}>
                        {order.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {order.items?.length || 0} {t('items')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Factory / Unit Management */}
        <Card data-testid="factory-management-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Building2 size={20} />
              Factory / Unit
            </CardTitle>
            <Button 
              size="sm" 
              className="gap-1"
              onClick={() => setFactoryDialogOpen(true)}
              data-testid="add-factory-btn"
            >
              <Plus size={16} />
              Add
            </Button>
          </CardHeader>
          <CardContent>
            {factories.length === 0 ? (
              <div className="empty-state py-8">
                <Building2 className="mx-auto text-muted-foreground mb-2" size={40} />
                <p className="text-muted-foreground">No factories added</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setFactoryDialogOpen(true)}
                >
                  Add First Factory
                </Button>
              </div>
            ) : (
              <div className="space-y-2" data-testid="factories-list">
                {factories.map((factory) => (
                  <div
                    key={factory.id}
                    className="flex items-center justify-between p-3 rounded-sm border border-border hover:bg-muted/50 transition-colors"
                    data-testid={`factory-item-${factory.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono">
                        {factory.code}
                      </Badge>
                      <span className="text-sm">{factory.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive h-8 w-8"
                      onClick={() => {
                        setFactoryToDelete(factory);
                        setDeleteDialogOpen(true);
                      }}
                      data-testid={`delete-factory-${factory.id}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Factory Dialog */}
      <Dialog open={factoryDialogOpen} onOpenChange={setFactoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Add Factory / Unit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Code *</label>
              <Input
                value={newFactory.code}
                onChange={(e) => setNewFactory({ ...newFactory, code: e.target.value.toUpperCase() })}
                placeholder="e.g., SAE"
                className="font-mono"
                maxLength={5}
                data-testid="factory-code-input"
              />
              <p className="text-xs text-muted-foreground">Short code (max 5 characters)</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={newFactory.name}
                onChange={(e) => setNewFactory({ ...newFactory, name: e.target.value })}
                placeholder="e.g., Shekhawati Art Exports"
                data-testid="factory-name-input"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setFactoryDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddFactory} data-testid="save-factory-btn">
                Add Factory
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Factory Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Factory</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{factoryToDelete?.code} - {factoryToDelete?.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteFactory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
