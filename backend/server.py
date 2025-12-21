from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import base64
import io
from weasyprint import HTML, CSS
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RgbColor
import json
import tempfile

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class OrderItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_code: str = ""
    description: str = ""
    category: str = ""
    height_cm: float = 0
    depth_cm: float = 0
    width_cm: float = 0
    cbm: float = 0
    cbm_auto: bool = True
    quantity: int = 1
    in_house_production: bool = True
    machine_hall: str = ""
    leather_code: str = ""
    finish_code: str = ""
    color_notes: str = ""
    leg_color: str = ""
    wood_finish: str = ""
    notes: str = ""  # Rich text HTML
    images: List[str] = []  # Base64 encoded images
    reference_images: List[str] = []

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sales_order_ref: str = ""
    buyer_po_ref: str = ""
    buyer_name: str = ""
    entry_date: str = ""
    status: str = "Draft"  # Draft, Submitted, In Production, Done
    factory: str = ""
    items: List[OrderItem] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class OrderCreate(BaseModel):
    sales_order_ref: str = ""
    buyer_po_ref: str = ""
    buyer_name: str = ""
    entry_date: str = ""
    status: str = "Draft"
    factory: str = ""
    items: List[OrderItem] = []

class OrderUpdate(BaseModel):
    sales_order_ref: Optional[str] = None
    buyer_po_ref: Optional[str] = None
    buyer_name: Optional[str] = None
    entry_date: Optional[str] = None
    status: Optional[str] = None
    factory: Optional[str] = None
    items: Optional[List[OrderItem]] = None

class LeatherLibraryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    name: str
    description: str = ""
    color: str = ""
    image: str = ""  # Base64
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class FinishLibraryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    name: str
    description: str = ""
    color: str = ""
    image: str = ""  # Base64
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TemplateSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "default"
    company_name: str = "JAIPUR – A fine wood furniture company"
    logo_text: str = "JAIPUR"
    primary_color: str = "#3d2c1e"
    accent_color: str = "#d4622e"
    font_family: str = "Playfair Display, serif"
    body_font: str = "Manrope, sans-serif"
    page_margin_mm: int = 15
    show_borders: bool = True
    header_height_mm: int = 25
    footer_height_mm: int = 20

class ExportRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    export_type: str  # pdf or ppt
    filename: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============ ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "JAIPUR Production Sheet API"}

# --- ORDERS ---

@api_router.get("/orders", response_model=List[Order])
async def get_orders():
    orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    return orders

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate):
    order = Order(**order_data.model_dump())
    doc = order.model_dump()
    await db.orders.insert_one(doc)
    return order

@api_router.put("/orders/{order_id}", response_model=Order)
async def update_order(order_id: str, order_data: OrderUpdate):
    existing = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Order not found")
    
    update_data = {k: v for k, v in order_data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Handle items serialization
    if "items" in update_data:
        update_data["items"] = [item.model_dump() if hasattr(item, 'model_dump') else item for item in update_data["items"]]
    
    await db.orders.update_one({"id": order_id}, {"$set": update_data})
    updated = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return updated

@api_router.delete("/orders/{order_id}")
async def delete_order(order_id: str):
    result = await db.orders.delete_one({"id": order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order deleted"}

# --- LEATHER LIBRARY ---

@api_router.get("/leather-library", response_model=List[LeatherLibraryItem])
async def get_leather_library():
    items = await db.leather_library.find({}, {"_id": 0}).to_list(1000)
    return items

@api_router.post("/leather-library", response_model=LeatherLibraryItem)
async def create_leather_item(item: LeatherLibraryItem):
    doc = item.model_dump()
    await db.leather_library.insert_one(doc)
    return item

@api_router.put("/leather-library/{item_id}", response_model=LeatherLibraryItem)
async def update_leather_item(item_id: str, item: LeatherLibraryItem):
    await db.leather_library.update_one({"id": item_id}, {"$set": item.model_dump()})
    return item

@api_router.delete("/leather-library/{item_id}")
async def delete_leather_item(item_id: str):
    result = await db.leather_library.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted"}

# --- FINISH LIBRARY ---

@api_router.get("/finish-library", response_model=List[FinishLibraryItem])
async def get_finish_library():
    items = await db.finish_library.find({}, {"_id": 0}).to_list(1000)
    return items

@api_router.post("/finish-library", response_model=FinishLibraryItem)
async def create_finish_item(item: FinishLibraryItem):
    doc = item.model_dump()
    await db.finish_library.insert_one(doc)
    return item

@api_router.put("/finish-library/{item_id}", response_model=FinishLibraryItem)
async def update_finish_item(item_id: str, item: FinishLibraryItem):
    await db.finish_library.update_one({"id": item_id}, {"$set": item.model_dump()})
    return item

@api_router.delete("/finish-library/{item_id}")
async def delete_finish_item(item_id: str):
    result = await db.finish_library.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted"}

# --- TEMPLATE SETTINGS ---

@api_router.get("/template-settings", response_model=TemplateSettings)
async def get_template_settings():
    settings = await db.template_settings.find_one({"id": "default"}, {"_id": 0})
    if not settings:
        default_settings = TemplateSettings()
        await db.template_settings.insert_one(default_settings.model_dump())
        return default_settings
    return settings

@api_router.put("/template-settings", response_model=TemplateSettings)
async def update_template_settings(settings: TemplateSettings):
    settings.id = "default"
    await db.template_settings.update_one(
        {"id": "default"}, 
        {"$set": settings.model_dump()}, 
        upsert=True
    )
    return settings

# --- FACTORIES ---

@api_router.get("/factories")
async def get_factories():
    return [
        {"id": "factory-1", "name": "Main Factory"},
        {"id": "factory-2", "name": "Unit 2 - Wood Workshop"},
        {"id": "factory-3", "name": "Unit 3 - Finishing Hall"},
        {"id": "factory-4", "name": "Unit 4 - Assembly"}
    ]

# --- CATEGORIES ---

@api_router.get("/categories")
async def get_categories():
    return [
        {"id": "chair", "name": "Chair"},
        {"id": "sofa", "name": "Sofa"},
        {"id": "bar-chair", "name": "Bar Chair"},
        {"id": "table", "name": "Table"},
        {"id": "bed", "name": "Bed"},
        {"id": "cabinet", "name": "Cabinet"},
        {"id": "shelf", "name": "Shelf"},
        {"id": "other", "name": "Other"}
    ]

# --- PDF EXPORT ---

def generate_pdf_html(order: dict, settings: dict) -> str:
    items_html = ""
    
    for idx, item in enumerate(order.get("items", [])):
        # Get first image or placeholder
        image_html = ""
        if item.get("images") and len(item["images"]) > 0:
            image_html = f'<img src="{item["images"][0]}" style="max-width:100%;max-height:250px;object-fit:contain;"/>'
        else:
            image_html = '<div style="width:100%;height:200px;background:#e0e0e0;display:flex;align-items:center;justify-content:center;color:#888;">No Image</div>'
        
        # Calculate CBM if auto
        cbm = item.get("cbm", 0)
        if item.get("cbm_auto", True):
            h = item.get("height_cm", 0) or 0
            d = item.get("depth_cm", 0) or 0
            w = item.get("width_cm", 0) or 0
            cbm = round((h * d * w) / 1000000, 4)
        
        notes_html = item.get("notes", "") or ""
        
        items_html += f'''
        <div class="item-page" style="page-break-after: always;">
            <div class="header">
                <div class="logo">
                    <h1 style="font-family:{settings.get('font_family', 'serif')};color:{settings.get('primary_color', '#3d2c1e')};margin:0;font-size:28px;">
                        {settings.get('logo_text', 'JAIPUR')}
                    </h1>
                    <p style="font-size:11px;margin:2px 0 0 0;color:#666;">{settings.get('company_name', '')}</p>
                </div>
                <div class="date-table">
                    <table style="font-size:10px;border-collapse:collapse;">
                        <tr><td style="padding:3px 8px;border:1px solid #ccc;background:#f5f5f5;">Entry Date</td><td style="padding:3px 8px;border:1px solid #ccc;">{order.get('entry_date', '')}</td></tr>
                        <tr><td style="padding:3px 8px;border:1px solid #ccc;background:#f5f5f5;">Factory</td><td style="padding:3px 8px;border:1px solid #ccc;">{order.get('factory', '')}</td></tr>
                        <tr><td style="padding:3px 8px;border:1px solid #ccc;background:#f5f5f5;">Sales Ref</td><td style="padding:3px 8px;border:1px solid #ccc;">{order.get('sales_order_ref', '')}</td></tr>
                        <tr><td style="padding:3px 8px;border:1px solid #ccc;background:#f5f5f5;">Buyer PO</td><td style="padding:3px 8px;border:1px solid #ccc;">{order.get('buyer_po_ref', '')}</td></tr>
                    </table>
                </div>
            </div>
            
            <div class="content-row" style="display:flex;gap:20px;margin-top:15px;">
                <div class="image-section" style="flex:1;min-width:300px;">
                    {image_html}
                </div>
                <div class="notes-section" style="flex:1;border:1px solid #ccc;padding:10px;min-height:200px;background:#fafafa;">
                    <h4 style="margin:0 0 10px 0;color:{settings.get('primary_color', '#3d2c1e')};font-size:12px;">NOTES</h4>
                    <div style="font-size:11px;line-height:1.5;">{notes_html}</div>
                    <div style="font-size:10px;margin-top:10px;color:#666;">
                        <p><strong>Leather:</strong> {item.get('leather_code', 'N/A')}</p>
                        <p><strong>Finish:</strong> {item.get('finish_code', 'N/A')}</p>
                        <p><strong>Color Notes:</strong> {item.get('color_notes', 'N/A')}</p>
                        <p><strong>Wood Finish:</strong> {item.get('wood_finish', 'N/A')}</p>
                    </div>
                </div>
            </div>
            
            <div class="details-table" style="margin-top:20px;">
                <table style="width:100%;border-collapse:collapse;font-size:11px;">
                    <thead>
                        <tr style="background:{settings.get('primary_color', '#3d2c1e')};color:white;">
                            <th style="padding:8px;text-align:left;border:1px solid #ccc;">Item Code</th>
                            <th style="padding:8px;text-align:left;border:1px solid #ccc;">Description</th>
                            <th style="padding:8px;text-align:center;border:1px solid #ccc;">H (cm)</th>
                            <th style="padding:8px;text-align:center;border:1px solid #ccc;">D (cm)</th>
                            <th style="padding:8px;text-align:center;border:1px solid #ccc;">W (cm)</th>
                            <th style="padding:8px;text-align:center;border:1px solid #ccc;">CBM</th>
                            <th style="padding:8px;text-align:center;border:1px solid #ccc;">Qty</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding:8px;border:1px solid #ccc;font-family:monospace;">{item.get('product_code', '')}</td>
                            <td style="padding:8px;border:1px solid #ccc;">{item.get('description', '')}</td>
                            <td style="padding:8px;text-align:center;border:1px solid #ccc;">{item.get('height_cm', 0)}</td>
                            <td style="padding:8px;text-align:center;border:1px solid #ccc;">{item.get('depth_cm', 0)}</td>
                            <td style="padding:8px;text-align:center;border:1px solid #ccc;">{item.get('width_cm', 0)}</td>
                            <td style="padding:8px;text-align:center;border:1px solid #ccc;">{cbm}</td>
                            <td style="padding:8px;text-align:center;border:1px solid #ccc;">{item.get('quantity', 1)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="footer" style="margin-top:20px;padding-top:10px;border-top:1px solid #ddd;font-size:9px;color:#888;text-align:center;">
                Buyer: {order.get('buyer_name', '')} | Page {idx + 1} of {len(order.get('items', []))}
            </div>
        </div>
        '''
    
    html = f'''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @page {{
                size: A4;
                margin: {settings.get('page_margin_mm', 15)}mm;
            }}
            body {{
                font-family: {settings.get('body_font', 'sans-serif')};
                font-size: 12px;
                line-height: 1.4;
                color: #333;
            }}
            .header {{
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                padding-bottom: 15px;
                border-bottom: 2px solid {settings.get('primary_color', '#3d2c1e')};
            }}
            .item-page {{
                padding: 0;
            }}
        </style>
    </head>
    <body>
        {items_html}
    </body>
    </html>
    '''
    return html

@api_router.get("/orders/{order_id}/export/pdf")
async def export_order_pdf(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    settings = await db.template_settings.find_one({"id": "default"}, {"_id": 0})
    if not settings:
        settings = TemplateSettings().model_dump()
    
    html_content = generate_pdf_html(order, settings)
    
    # Generate PDF
    pdf_bytes = HTML(string=html_content).write_pdf()
    
    # Save export record
    export_record = ExportRecord(
        order_id=order_id,
        export_type="pdf",
        filename=f"order_{order.get('sales_order_ref', order_id)}.pdf"
    )
    await db.exports.insert_one(export_record.model_dump())
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=order_{order.get('sales_order_ref', order_id)}.pdf"}
    )

@api_router.get("/orders/{order_id}/preview-html")
async def preview_order_html(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    settings = await db.template_settings.find_one({"id": "default"}, {"_id": 0})
    if not settings:
        settings = TemplateSettings().model_dump()
    
    html_content = generate_pdf_html(order, settings)
    return {"html": html_content}

# --- PPT EXPORT ---

@api_router.get("/orders/{order_id}/export/ppt")
async def export_order_ppt(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    settings = await db.template_settings.find_one({"id": "default"}, {"_id": 0})
    if not settings:
        settings = TemplateSettings().model_dump()
    
    prs = Presentation()
    prs.slide_width = Inches(10)
    prs.slide_height = Inches(7.5)
    
    # Title slide
    title_slide_layout = prs.slide_layouts[6]  # Blank
    slide = prs.slides.add_slide(title_slide_layout)
    
    # Add title
    left = Inches(0.5)
    top = Inches(2.5)
    width = Inches(9)
    height = Inches(1.5)
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    p = tf.paragraphs[0]
    p.text = settings.get('logo_text', 'JAIPUR')
    p.font.size = Pt(48)
    p.font.bold = True
    
    # Subtitle
    left = Inches(0.5)
    top = Inches(4)
    width = Inches(9)
    height = Inches(1)
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    p = tf.paragraphs[0]
    p.text = f"Production Sheet - {order.get('sales_order_ref', '')} | Buyer: {order.get('buyer_name', '')}"
    p.font.size = Pt(24)
    
    # Item slides
    for item in order.get("items", []):
        slide = prs.slides.add_slide(title_slide_layout)
        
        # Item code title
        txBox = slide.shapes.add_textbox(Inches(0.5), Inches(0.3), Inches(9), Inches(0.5))
        tf = txBox.text_frame
        p = tf.paragraphs[0]
        p.text = f"{item.get('product_code', 'N/A')} - {item.get('description', '')}"
        p.font.size = Pt(24)
        p.font.bold = True
        
        # Details table info
        details_text = f"""
Category: {item.get('category', 'N/A')}
Size: H {item.get('height_cm', 0)} × D {item.get('depth_cm', 0)} × W {item.get('width_cm', 0)} cm
CBM: {item.get('cbm', 0)} | Quantity: {item.get('quantity', 1)} pcs
Leather: {item.get('leather_code', 'N/A')} | Finish: {item.get('finish_code', 'N/A')}
Color Notes: {item.get('color_notes', 'N/A')}
Wood Finish: {item.get('wood_finish', 'N/A')}
"""
        txBox = slide.shapes.add_textbox(Inches(5), Inches(1.2), Inches(4.5), Inches(3))
        tf = txBox.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = details_text
        p.font.size = Pt(14)
        
        # Notes
        if item.get('notes'):
            txBox = slide.shapes.add_textbox(Inches(5), Inches(4.5), Inches(4.5), Inches(2.5))
            tf = txBox.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            # Strip HTML tags for PPT
            import re
            notes_plain = re.sub('<[^<]+?>', '', item.get('notes', ''))
            p.text = f"Notes:\n{notes_plain}"
            p.font.size = Pt(12)
        
        # Image placeholder text
        if item.get('images') and len(item['images']) > 0:
            txBox = slide.shapes.add_textbox(Inches(0.5), Inches(1.2), Inches(4), Inches(0.5))
            tf = txBox.text_frame
            p = tf.paragraphs[0]
            p.text = "[Product Image]"
            p.font.size = Pt(14)
            p.font.italic = True
    
    # Save to bytes
    ppt_bytes = io.BytesIO()
    prs.save(ppt_bytes)
    ppt_bytes.seek(0)
    
    # Save export record
    export_record = ExportRecord(
        order_id=order_id,
        export_type="ppt",
        filename=f"order_{order.get('sales_order_ref', order_id)}.pptx"
    )
    await db.exports.insert_one(export_record.model_dump())
    
    return StreamingResponse(
        ppt_bytes,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f"attachment; filename=order_{order.get('sales_order_ref', order_id)}.pptx"}
    )

# --- EXPORT HISTORY ---

@api_router.get("/exports", response_model=List[ExportRecord])
async def get_exports():
    exports = await db.exports.find({}, {"_id": 0}).to_list(1000)
    return exports

@api_router.get("/exports/{order_id}", response_model=List[ExportRecord])
async def get_order_exports(order_id: str):
    exports = await db.exports.find({"order_id": order_id}, {"_id": 0}).to_list(100)
    return exports

# --- DASHBOARD STATS ---

@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    total_orders = await db.orders.count_documents({})
    draft_orders = await db.orders.count_documents({"status": "Draft"})
    in_production = await db.orders.count_documents({"status": "In Production"})
    completed = await db.orders.count_documents({"status": "Done"})
    
    # Get recent orders
    recent_orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "total_orders": total_orders,
        "draft_orders": draft_orders,
        "in_production": in_production,
        "completed": completed,
        "recent_orders": recent_orders
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
