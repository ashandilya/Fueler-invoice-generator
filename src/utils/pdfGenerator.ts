import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice } from '../types/invoice';
import { formatDate } from './invoiceUtils';

// Helper function to convert image to base64
const getImageAsBase64 = async (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If it's already a data URL, return it
    if (src.startsWith('data:')) {
      resolve(src);
      return;
    }
    
    // If it's a relative path, convert to absolute and fetch
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      console.warn(`Failed to load image: ${src}`);
      resolve(''); // Return empty string if image fails to load
    };
    
    // Handle relative paths
    if (src.startsWith('/')) {
      img.src = window.location.origin + src;
    } else {
      img.src = src;
    }
  });
};

export const generateInvoicePDF = async (invoice: Invoice): Promise<void> => {
  try {
    // Convert images to base64 if needed
    let logoBase64 = '';
    let signatureBase64 = '';
    
    if (invoice.company.logo) {
      logoBase64 = await getImageAsBase64(invoice.company.logo);
    }
    
    if (invoice.company.signature) {
      signatureBase64 = await getImageAsBase64(invoice.company.signature);
    }
    
    // Create a temporary container for the invoice
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '794px'; // A4 width in pixels at 96 DPI
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.padding = '40px';
    tempContainer.style.fontFamily = 'Arial, sans-serif';
    
    // Create the invoice HTML content with base64 images
    const invoiceHTML = createInvoiceHTML(invoice, logoBase64, signatureBase64);
    tempContainer.innerHTML = invoiceHTML;
    
    // Add to document
    document.body.appendChild(tempContainer);
    
    // Wait a bit for images to load
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate canvas from HTML
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794,
      height: tempContainer.scrollHeight,
    });
    
    // Remove temporary container
    document.body.removeChild(tempContainer);
    
    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add image to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    // Download the PDF
    const fileName = `Invoice-${invoice.invoiceNumber}.pdf`;
    pdf.save(fileName);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

const createInvoiceHTML = (invoice: Invoice, logoBase64: string = '', signatureBase64: string = ''): string => {
  const formatCurrency = (amount: number, currency: 'USD' | 'INR'): string => {
    const formatter = new Intl.NumberFormat(
      currency === 'USD' ? 'en-US' : 'en-IN',
      {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
    return formatter.format(amount);
  };

  const discountAmount = invoice.discountType === 'percentage' 
    ? (invoice.subtotal * invoice.discount) / 100 
    : invoice.discount;

  return `
    <div style="max-width: 794px; margin: 0 auto; padding: 40px; font-family: Arial, sans-serif; color: #333;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
        <div style="display: flex; flex-direction: column;">
          ${logoBase64 ? `
            <img src="${logoBase64}" alt="Company Logo" style="height: 48px; width: auto; margin-bottom: 12px;" />
          ` : ''}
          <div style="color: #000000; font-size: 10px; line-height: 1.4;">
            <div style="font-weight: 600;">KiwisMedia Technologies Pvt. Ltd.</div>
            <div>CIN: U72900TR2019PTC013632</div>
            <div>PAN: AAHCK4516B</div>
          </div>
        </div>
        <div style="text-align: right;">
          <h1 style="font-size: 32px; font-weight: bold; margin: 0; color: #1f2937;">INVOICE</h1>
          <p style="font-size: 14px; color: #6b7280; margin: 5px 0;">#${invoice.invoiceNumber}</p>
        </div>
      </div>

      <!-- Company and Client Info -->
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; margin-bottom: 40px;">
        <div>
          <h3 style="font-weight: 600; color: #1f2937; margin-bottom: 10px; font-size: 14px;">From:</h3>
          <div style="font-size: 12px; color: #4b5563; line-height: 1.5;">
            ${invoice.company.name ? `<p style="font-weight: 500; margin: 0 0 5px 0;">${invoice.company.name}</p>` : ''}
            ${invoice.company.contactName ? `<p style="margin: 0 0 5px 0;">${invoice.company.contactName}</p>` : ''}
            ${invoice.company.address ? `<p style="margin: 0 0 5px 0; white-space: pre-line;">${invoice.company.address}</p>` : ''}
            ${invoice.company.city ? `<p style="margin: 0 0 5px 0;">${invoice.company.city}</p>` : ''}
            ${invoice.company.state ? `<p style="margin: 0 0 5px 0;">${invoice.company.state}</p>` : ''}
            ${invoice.company.country ? `<p style="margin: 0 0 5px 0;">${invoice.company.country}</p>` : ''}
          </div>
        </div>
        <div>
          <h3 style="font-weight: 600; color: #1f2937; margin-bottom: 10px; font-size: 14px;">To:</h3>
          <div style="font-size: 12px; color: #4b5563; line-height: 1.5;">
            <p style="font-weight: 500; margin: 0 0 5px 0;">${invoice.client.name || 'Client Name'}</p>
            ${invoice.client.address ? `<p style="margin: 0 0 5px 0; white-space: pre-line;">${invoice.client.address}</p>` : ''}
            ${invoice.client.city ? `<p style="margin: 0 0 5px 0;">${invoice.client.city}</p>` : ''}
            ${invoice.client.state ? `<p style="margin: 0 0 5px 0;">${invoice.client.state}</p>` : ''}
            ${invoice.client.country ? `<p style="margin: 0 0 5px 0;">${invoice.client.country}</p>` : ''}
            ${invoice.client.gstin ? `<p style="margin: 0 0 5px 0;">GSTIN: ${invoice.client.gstin}</p>` : ''}
          </div>
        </div>
        <div>
          <div style="margin-bottom: 15px;">
            <p style="font-size: 12px; font-weight: bold; color: #374151; margin: 0 0 3px 0;">Invoice Date</p>
            <p style="font-size: 12px; color: #1f2937; margin: 0;">${formatDate(invoice.date)}</p>
          </div>
          <div>
            <p style="font-size: 12px; font-weight: bold; color: #374151; margin: 0 0 3px 0;">Due Date</p>
            <p style="font-size: 12px; color: #1f2937; margin: 0;">${formatDate(invoice.dueDate)}</p>
          </div>
        </div>
      </div>

      <!-- Line Items -->
      <div style="margin-bottom: 30px;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #e5e7eb;">
              <th style="text-align: left; padding: 12px 8px; font-weight: 600; color: #374151; font-size: 12px; width: 60px;">Sr. no</th>
              <th style="text-align: left; padding: 12px 8px; font-weight: 600; color: #374151; font-size: 12px;">Description</th>
              <th style="text-align: right; padding: 12px 8px; font-weight: 600; color: #374151; font-size: 12px; width: 80px;">Qty</th>
              <th style="text-align: right; padding: 12px 8px; font-weight: 600; color: #374151; font-size: 12px; width: 100px;">Rate</th>
              <th style="text-align: right; padding: 12px 8px; font-weight: 600; color: #374151; font-size: 12px; width: 100px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.length === 0 ? `
              <tr>
                <td colspan="5" style="text-align: center; padding: 40px 8px; color: #6b7280; font-size: 12px;">
                  No items added yet
                </td>
              </tr>
            ` : invoice.items.map((item, index) => `
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 12px 8px; font-size: 12px; color: #1f2937;">
                  ${index + 1}
                </td>
                <td style="padding: 12px 8px; font-size: 12px; color: #1f2937;">
                  ${item.description || 'Item description'}
                </td>
                <td style="padding: 12px 8px; font-size: 12px; color: #1f2937; text-align: right;">
                  ${item.quantity}
                </td>
                <td style="padding: 12px 8px; font-size: 12px; color: #1f2937; text-align: right;">
                  ${formatCurrency(item.rate, invoice.currency)}
                </td>
                <td style="padding: 12px 8px; font-size: 12px; color: #1f2937; text-align: right; font-weight: 500;">
                  ${formatCurrency(item.amount, invoice.currency)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
        <div style="width: 300px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 12px;">
            <span style="color: #6b7280;">Subtotal:</span>
            <span style="color: #1f2937;">${formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          ${invoice.discount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 12px;">
              <span style="color: #6b7280;">
                Discount ${invoice.discountType === 'percentage' ? `(${invoice.discount}%)` : ''}:
              </span>
              <span style="color: #1f2937;">
                -${formatCurrency(discountAmount, invoice.currency)}
              </span>
            </div>
          ` : ''}
          ${invoice.taxRate > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 12px;">
              <span style="color: #6b7280;">Tax (${invoice.taxRate}%):</span>
              <span style="color: #1f2937;">${formatCurrency(invoice.tax, invoice.currency)}</span>
            </div>
          ` : ''}
          <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 8px;">
            <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 14px;">
              <span style="color: #1f2937;">Total:</span>
              <span style="color: #1f2937;">${formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes and Payment Terms with Signature -->
      ${(invoice.notes || invoice.paymentTerms || signatureBase64) ? `
        <div style="border-top: 1px solid #e5e7eb; padding-top: 30px;">
          ${invoice.notes ? `
            <div style="margin-bottom: 20px;">
              <h4 style="font-weight: 600; color: #1f2937; margin-bottom: 8px; font-size: 14px;">Notes:</h4>
              <p style="font-size: 12px; color: #4b5563; white-space: pre-line; line-height: 1.5; margin: 0; word-wrap: break-word;">${invoice.notes}</p>
            </div>
          ` : ''}
          
          <!-- Payment Terms and Signature Container -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <!-- Payment Terms -->
            ${invoice.paymentTerms ? `
              <div style="flex: 1; padding-right: 32px;">
                <h4 style="font-weight: 600; color: #1f2937; margin-bottom: 8px; font-size: 14px;">Payment Terms:</h4>
                <p style="font-size: 12px; color: #4b5563; white-space: pre-line; line-height: 1.5; margin: 0; word-wrap: break-word;">${invoice.paymentTerms}</p>
              </div>
            ` : ''}
            
            <!-- Signature positioned in bottom-right -->
            ${signatureBase64 ? `
              <div style="text-align: center; flex-shrink: 0;">
                <img src="${signatureBase64}" alt="Signature" style="height: 50px; width: auto; margin-bottom: 8px;" />
                <p style="font-size: 12px; color: #6b7280; margin: 0;">Authorized Signature</p>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}
    </div>
  `;
};