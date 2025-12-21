import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ordersApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { 
  ArrowLeft, 
  Edit, 
  FileDown, 
  FileText, 
  Eye,
  Download,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';

const statusColors = {
  'Draft': 'bg-yellow-100 text-yellow-800',
  'Submitted': 'bg-blue-100 text-blue-800',
  'In Production': 'bg-purple-100 text-purple-800',
  'Done': 'bg-green-100 text-green-800',
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const response = await ordersApi.getById(id);
      setOrder(response.data);
    } catch (error) {
      console.error('Error loading order:', error);
      toast.error('Failed to load order');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = () => {
    window.open(ordersApi.exportPdf(id), '_blank');
    toast.success('PDF download started');
  };

  const handleExportPpt = () => {
    window.open(ordersApi.exportPpt(id), '_blank');
    toast.success('PPT download started');
  };

  const handleWhatsAppShare = () => {
    const pdfUrl = ordersApi.exportPdf(id);
    const message = `JAIPUR Production Sheet\nOrder: ${order?.sales_order_ref || 'N/A'}\nBuyer: ${order?.buyer_name || 'N/A'}\nItems: ${order?.items?.length || 0}\n\nDownload PDF: ${pdfUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast.success('Opening WhatsApp...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="order-detail-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="empty-state" data-testid="order-not-found">
        <FileText className="empty-state-icon mx-auto" />
        <p>Order not found</p>
        <Link to="/orders">
          <Button variant="outline" className="mt-4">Back to Orders</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" data-testid="order-detail-page">
      {/* Header */}
      <div className="page-header">
        <Button 
          variant="ghost" 
          className="mb-4 gap-2"
          onClick={() => navigate('/orders')}
          data-testid="back-btn"
        >
          <ArrowLeft size={18} />
          Back to Orders
        </Button>
        
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title font-mono" data-testid="order-ref">
                {order.sales_order_ref || 'Untitled Order'}
              </h1>
              <Badge className={statusColors[order.status] || 'bg-gray-100'}>
                {order.status}
              </Badge>
            </div>
            <p className="page-description">
              Buyer: {order.buyer_name || 'N/A'} | PO: {order.buyer_po_ref || 'N/A'}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Link to={`/orders/${id}/preview`}>
              <Button variant="outline" className="gap-2" data-testid="preview-btn">
                <Eye size={18} />
                Preview
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800"
              onClick={handleWhatsAppShare}
              data-testid="whatsapp-btn"
            >
              <Share2 size={18} />
              WhatsApp
            </Button>
            <Button 
              className="gap-2"
              onClick={handleExportPdf}
              data-testid="export-pdf-btn"
            >
              <FileDown size={18} />
              PDF
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleExportPpt}
              data-testid="export-ppt-btn"
            >
              <Download size={18} />
              PPT
            </Button>
            <Link to={`/orders/${id}/edit`}>
              <Button variant="secondary" className="gap-2" data-testid="edit-btn">
                <Edit size={18} />
                Edit
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Order Info */}
      <Card className="mb-6" data-testid="order-info-card">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Order Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Entry Date</p>
              <p className="font-medium">{order.entry_date || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Factory</p>
              <p className="font-medium">{order.factory || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="font-medium">{order.items?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card data-testid="items-card">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Line Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(!order.items || order.items.length === 0) ? (
            <div className="empty-state" data-testid="no-items">
              <FileText className="empty-state-icon mx-auto" />
              <p>No items in this order</p>
              <Link to={`/orders/${id}/edit`}>
                <Button variant="outline" className="mt-4">Add Items</Button>
              </Link>
            </div>
          ) : (
            <Table data-testid="items-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Item Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">H (cm)</TableHead>
                  <TableHead className="text-center">D (cm)</TableHead>
                  <TableHead className="text-center">W (cm)</TableHead>
                  <TableHead className="text-center">CBM</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead>Images</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item, index) => {
                  const cbm = item.cbm_auto 
                    ? ((item.height_cm || 0) * (item.depth_cm || 0) * (item.width_cm || 0) / 1000000).toFixed(4)
                    : item.cbm;
                  
                  return (
                    <TableRow key={item.id || index} data-testid={`item-row-${index}`}>
                      <TableCell className="font-mono font-medium">
                        {item.product_code || '-'}
                      </TableCell>
                      <TableCell>{item.description || '-'}</TableCell>
                      <TableCell>{item.category || '-'}</TableCell>
                      <TableCell className="text-center">{item.height_cm || 0}</TableCell>
                      <TableCell className="text-center">{item.depth_cm || 0}</TableCell>
                      <TableCell className="text-center">{item.width_cm || 0}</TableCell>
                      <TableCell className="text-center font-mono">{cbm}</TableCell>
                      <TableCell className="text-center">{item.quantity || 1}</TableCell>
                      <TableCell>
                        {item.images?.length > 0 ? (
                          <span className="text-sm text-muted-foreground">
                            {item.images.length} image(s)
                          </span>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
