import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ordersApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { 
  ArrowLeft, 
  FileDown, 
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function OrderPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const [orderRes, previewRes] = await Promise.all([
        ordersApi.getById(id),
        ordersApi.previewHtml(id),
      ]);
      setOrder(orderRes.data);
      setPreviewHtml(previewRes.data.html);
    } catch (error) {
      console.error('Error loading preview:', error);
      toast.error('Failed to load preview');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = () => {
    window.open(ordersApi.exportPdf(id), '_blank');
    toast.success('PDF export started');
  };

  const handleExportPpt = () => {
    window.open(ordersApi.exportPpt(id), '_blank');
    toast.success('PPT export started');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="preview-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const totalPages = order?.items?.length || 0;

  return (
    <div className="animate-fade-in" data-testid="preview-page">
      {/* Header */}
      <div className="page-header">
        <Button 
          variant="ghost" 
          className="mb-4 gap-2"
          onClick={() => navigate(`/orders/${id}`)}
          data-testid="back-btn"
        >
          <ArrowLeft size={18} />
          Back to Order
        </Button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="page-title" data-testid="preview-title">PDF Preview</h1>
            <p className="page-description font-mono">{order?.sales_order_ref || 'Order'}</p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleExportPdf}
              data-testid="export-pdf-btn"
            >
              <FileDown size={18} />
              Download PDF
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleExportPpt}
              data-testid="export-ppt-btn"
            >
              <Download size={18} />
              Download PPT
            </Button>
          </div>
        </div>
      </div>

      {/* Page Navigation */}
      {totalPages > 0 && (
        <div className="flex items-center justify-center gap-4 mb-6" data-testid="page-navigation">
          <Button 
            variant="outline" 
            size="icon"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(p => p - 1)}
            data-testid="prev-page-btn"
          >
            <ChevronLeft size={18} />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </span>
          <Button 
            variant="outline" 
            size="icon"
            disabled={currentPage === totalPages - 1}
            onClick={() => setCurrentPage(p => p + 1)}
            data-testid="next-page-btn"
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      )}

      {/* Preview Container */}
      <div className="preview-container rounded-sm" data-testid="preview-container">
        {totalPages === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">No items to preview</p>
            <Link to={`/orders/${id}/edit`}>
              <Button variant="outline">Add Items</Button>
            </Link>
          </div>
        ) : (
          <div 
            className="preview-paper"
            data-testid="preview-paper"
          >
            <PreviewPage 
              order={order} 
              item={order.items[currentPage]} 
              pageNum={currentPage + 1}
              totalPages={totalPages}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewPage({ order, item, pageNum, totalPages }) {
  const cbm = item.cbm_auto 
    ? ((item.height_cm || 0) * (item.depth_cm || 0) * (item.width_cm || 0) / 1000000).toFixed(4)
    : item.cbm;

  return (
    <div className="h-full flex flex-col text-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>
      {/* Header */}
      <div className="flex justify-between items-start pb-4 border-b-2 border-primary mb-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-primary">JAIPUR</h1>
          <p className="text-xs text-muted-foreground">A fine wood furniture company</p>
        </div>
        <div className="text-right">
          <table className="text-xs border-collapse">
            <tbody>
              <tr>
                <td className="px-2 py-1 border bg-muted font-medium">Entry Date</td>
                <td className="px-2 py-1 border">{order.entry_date || '-'}</td>
              </tr>
              <tr>
                <td className="px-2 py-1 border bg-muted font-medium">Factory</td>
                <td className="px-2 py-1 border">{order.factory || '-'}</td>
              </tr>
              <tr>
                <td className="px-2 py-1 border bg-muted font-medium">Sales Ref</td>
                <td className="px-2 py-1 border font-mono">{order.sales_order_ref || '-'}</td>
              </tr>
              <tr>
                <td className="px-2 py-1 border bg-muted font-medium">Buyer PO</td>
                <td className="px-2 py-1 border font-mono">{order.buyer_po_ref || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex gap-4">
        {/* Image Section */}
        <div className="flex-1">
          {item.images?.length > 0 ? (
            <img 
              src={item.images[0]} 
              alt={item.product_code}
              className="max-w-full max-h-64 object-contain border rounded-sm"
            />
          ) : (
            <div className="w-full h-48 bg-muted rounded-sm flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div className="flex-1 border rounded-sm p-3 bg-muted/30">
          <h4 className="font-semibold text-primary text-xs mb-2 uppercase tracking-wide">Notes</h4>
          <div 
            className="text-xs leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: item.notes || '<p class="text-muted-foreground">No notes</p>' }}
          />
          
          <div className="mt-4 pt-3 border-t space-y-1 text-xs">
            <p><strong>Leather:</strong> {item.leather_code || 'N/A'}</p>
            <p><strong>Finish:</strong> {item.finish_code || 'N/A'}</p>
            <p><strong>Color Notes:</strong> {item.color_notes || 'N/A'}</p>
            <p><strong>Wood Finish:</strong> {item.wood_finish || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Details Table */}
      <div className="mt-4">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-primary text-primary-foreground">
              <th className="px-2 py-2 text-left border">Item Code</th>
              <th className="px-2 py-2 text-left border">Description</th>
              <th className="px-2 py-2 text-center border">H (cm)</th>
              <th className="px-2 py-2 text-center border">D (cm)</th>
              <th className="px-2 py-2 text-center border">W (cm)</th>
              <th className="px-2 py-2 text-center border">CBM</th>
              <th className="px-2 py-2 text-center border">Qty</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-2 py-2 border font-mono">{item.product_code || '-'}</td>
              <td className="px-2 py-2 border">{item.description || '-'}</td>
              <td className="px-2 py-2 border text-center">{item.height_cm || 0}</td>
              <td className="px-2 py-2 border text-center">{item.depth_cm || 0}</td>
              <td className="px-2 py-2 border text-center">{item.width_cm || 0}</td>
              <td className="px-2 py-2 border text-center font-mono">{cbm}</td>
              <td className="px-2 py-2 border text-center">{item.quantity || 1}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-2 border-t text-xs text-muted-foreground text-center">
        Buyer: {order.buyer_name || 'N/A'} | Page {pageNum} of {totalPages}
      </div>
    </div>
  );
}
