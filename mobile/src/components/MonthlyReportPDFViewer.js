import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const MonthlyReportPDFViewer = ({ visible, report, onClose }) => {
  const [loading, setLoading] = useState(false);

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === '') {
      return '€0.00';
    }
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) {
      return '€0.00';
    }
    return `€${numAmount.toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const months = [
      'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
      'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Generate HTML for PDF
  const generateHTML = () => {
    const spendingRows = report.spending_breakdown?.map(spending => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${spending.config_title || spending.name || 'N/A'}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">
          ${formatCurrency(spending.allocated_amount || spending.amount)}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b;">
          ${spending.percentage ? parseFloat(spending.percentage).toFixed(1) + '%' : '0.0%'}
        </td>
      </tr>
    `).join('') || '';

    // Calculate total spending from spending_breakdown
    const totalSpending = report.spending_breakdown?.reduce((sum, s) => 
      sum + parseFloat(s.allocated_amount || s.amount || 0), 0
    ) || 0;

    const totalBudgetAmount = parseFloat(report.total_budget || 0);
    const remainingBudget = totalBudgetAmount - totalSpending;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              padding: 40px;
              color: #1e293b;
              background: white;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 3px solid #059669;
            }
            .logo {
              font-size: 28px;
              font-weight: 700;
              color: #059669;
              margin-bottom: 10px;
            }
            .title {
              font-size: 24px;
              font-weight: 700;
              color: #1e293b;
              margin-bottom: 8px;
            }
            .subtitle {
              font-size: 16px;
              color: #64748b;
            }
            .info-section {
              margin-bottom: 30px;
              padding: 20px;
              background: #f8fafc;
              border-radius: 8px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e2e8f0;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              color: #64748b;
              font-weight: 500;
            }
            .info-value {
              color: #1e293b;
              font-weight: 600;
            }
            .section-title {
              font-size: 18px;
              font-weight: 700;
              color: #1e293b;
              margin-bottom: 15px;
              margin-top: 30px;
            }
            .budget-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin-bottom: 30px;
            }
            .budget-card {
              padding: 20px;
              border-radius: 8px;
              text-align: center;
            }
            .budget-card.total {
              background: #d1fae5;
              border: 2px solid #059669;
            }
            .budget-card.spent {
              background: #fef3c7;
              border: 2px solid #f59e0b;
            }
            .budget-card.remaining {
              background: #dbeafe;
              border: 2px solid #3b82f6;
            }
            .budget-label {
              font-size: 13px;
              margin-bottom: 8px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .budget-card.total .budget-label {
              color: #065f46;
            }
            .budget-card.spent .budget-label {
              color: #92400e;
            }
            .budget-card.remaining .budget-label {
              color: #1e40af;
            }
            .budget-value {
              font-size: 24px;
              font-weight: 700;
            }
            .budget-card.total .budget-value {
              color: #059669;
            }
            .budget-card.spent .budget-value {
              color: #f59e0b;
            }
            .budget-card.remaining .budget-value {
              color: #3b82f6;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              background: white;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              overflow: hidden;
            }
            th {
              background: #f8fafc;
              padding: 12px;
              text-align: left;
              font-weight: 600;
              color: #475569;
              border-bottom: 2px solid #e2e8f0;
            }
            th.right {
              text-align: right;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #e2e8f0;
            }
            tr:last-child td {
              border-bottom: none;
            }
            .notes {
              background: #fef3c7;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #f59e0b;
              margin-top: 20px;
            }
            .notes-title {
              font-weight: 600;
              color: #92400e;
              margin-bottom: 10px;
            }
            .notes-content {
              color: #78350f;
              line-height: 1.6;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e2e8f0;
              text-align: center;
              color: #64748b;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">BllokuSync</div>
            <div class="title">Raporti Mujor</div>
            <div class="subtitle">${formatDate(report.report_month)}</div>
          </div>

          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Prona:</span>
              <span class="info-value">${report.property?.name || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Adresa:</span>
              <span class="info-value">${report.property?.address || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Muaji i Raportit:</span>
              <span class="info-value">${formatDate(report.report_month)}</span>
            </div>
          </div>

          <div class="section-title">Përmbledhje e Buxhetit</div>
          <div class="budget-grid">
            <div class="budget-card total">
              <div class="budget-label">Buxheti Total</div>
              <div class="budget-value">${formatCurrency(totalBudgetAmount)}</div>
            </div>
            <div class="budget-card spent">
              <div class="budget-label">Shpenzuar</div>
              <div class="budget-value">${formatCurrency(totalSpending)}</div>
            </div>
            <div class="budget-card remaining">
              <div class="budget-label">Mbetur</div>
              <div class="budget-value">${formatCurrency(remainingBudget)}</div>
            </div>
          </div>

          ${report.spending_breakdown && report.spending_breakdown.length > 0 ? `
            <div class="section-title">Shpërndarja e Shpenzimeve</div>
            <table>
              <thead>
                <tr>
                  <th>Kategoria</th>
                  <th class="right">Shuma</th>
                  <th class="right">Përqindja</th>
                </tr>
              </thead>
              <tbody>
                ${spendingRows}
              </tbody>
            </table>
          ` : ''}

          ${report.notes ? `
            <div class="notes">
              <div class="notes-title">📝 Shënime</div>
              <div class="notes-content">${report.notes}</div>
            </div>
          ` : ''}

          <div class="footer">
            <p>Gjeneruar nga BllokuSync</p>
            <p>Data e gjenerimit: ${new Date().toLocaleDateString('sq-AL')}</p>
          </div>
        </body>
      </html>
    `;
  };

  // Handle view/share PDF
  const handleViewPDF = async () => {
    if (!report) return;

    try {
      setLoading(true);

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: generateHTML(),
        base64: false,
      });

      // On iOS and Android, we can share the PDF to open in native viewers
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Raporti Mujor - ${formatDate(report.report_month)}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert(
          'PDF i Gjeneruar',
          'PDF-ja u krijua por nuk mund të ndahet në këtë pajisje.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert(
        'Gabim',
        'Nuk u arrit të gjenerohet PDF-ja. Ju lutemi provoni përsëri.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  if (!report) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Raporti Mujor</Text>
              <Text style={styles.modalSubtitle}>{formatDate(report.report_month)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Report Preview */}
          <View style={styles.previewContainer}>
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <Ionicons name="document-text" size={48} color="#059669" />
                <Text style={styles.previewTitle}>{report.property?.name || 'Prona'}</Text>
                <Text style={styles.previewSubtitle}>{formatDate(report.report_month)}</Text>
              </View>

              <View style={styles.previewDivider} />

              <View style={styles.previewDetails}>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Buxheti Total:</Text>
                  <Text style={styles.previewValue}>{formatCurrency(report.total_budget)}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Shpenzime:</Text>
                  <Text style={styles.previewValue}>
                    {report.spending_breakdown?.length || 0} kategori
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleViewPDF}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="eye" size={24} color="#fff" />
                  <Text style={styles.buttonText}>Shiko PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  previewContainer: {
    marginBottom: 24,
  },
  previewCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  previewHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 12,
  },
  previewSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  previewDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  previewDetails: {
    gap: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#059669',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#059669',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#059669',
  },
});

export default MonthlyReportPDFViewer;
