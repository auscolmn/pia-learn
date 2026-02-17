import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer'

// Register fonts (using system fonts as fallback)
Font.register({
  family: 'Playfair Display',
  src: 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQ.ttf',
  fontWeight: 'normal',
})

Font.register({
  family: 'Playfair Display',
  src: 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKd5ukDQ.ttf',
  fontWeight: 'bold',
})

Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.ttf',
  fontWeight: 'normal',
})

Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.ttf',
  fontWeight: 'bold',
})

// Helper to convert hex to rgba
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 79, g: 70, b: 229 } // default indigo
}

function lightenColor(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex)
  const lighten = (c: number) => Math.min(255, Math.round(c + (255 - c) * percent))
  return `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`
}

export interface CertificateData {
  recipientName: string
  courseTitle: string
  orgName: string
  orgLogoUrl?: string | null
  primaryColor: string
  secondaryColor: string
  certificateNumber: string
  issuedAt: string
  qrCodeDataUrl: string // base64 data URL
  instructorName?: string | null
}

export default function CertificateTemplate({ data }: { data: CertificateData }) {
  const {
    recipientName,
    courseTitle,
    orgName,
    orgLogoUrl,
    primaryColor,
    secondaryColor,
    certificateNumber,
    issuedAt,
    qrCodeDataUrl,
    instructorName,
  } = data

  const formattedDate = new Date(issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Create dynamic styles based on org colors
  const styles = StyleSheet.create({
    page: {
      backgroundColor: '#FFFFFF',
      padding: 0,
      fontFamily: 'Inter',
    },
    container: {
      position: 'relative',
      width: '100%',
      height: '100%',
    },
    // Decorative border
    border: {
      position: 'absolute',
      top: 20,
      left: 20,
      right: 20,
      bottom: 20,
      borderWidth: 3,
      borderColor: primaryColor,
      borderStyle: 'solid',
    },
    innerBorder: {
      position: 'absolute',
      top: 28,
      left: 28,
      right: 28,
      bottom: 28,
      borderWidth: 1,
      borderColor: lightenColor(primaryColor, 0.5),
      borderStyle: 'solid',
    },
    // Corner decorations
    cornerTopLeft: {
      position: 'absolute',
      top: 15,
      left: 15,
      width: 50,
      height: 50,
      borderTopWidth: 6,
      borderLeftWidth: 6,
      borderColor: secondaryColor,
    },
    cornerTopRight: {
      position: 'absolute',
      top: 15,
      right: 15,
      width: 50,
      height: 50,
      borderTopWidth: 6,
      borderRightWidth: 6,
      borderColor: secondaryColor,
    },
    cornerBottomLeft: {
      position: 'absolute',
      bottom: 15,
      left: 15,
      width: 50,
      height: 50,
      borderBottomWidth: 6,
      borderLeftWidth: 6,
      borderColor: secondaryColor,
    },
    cornerBottomRight: {
      position: 'absolute',
      bottom: 15,
      right: 15,
      width: 50,
      height: 50,
      borderBottomWidth: 6,
      borderRightWidth: 6,
      borderColor: secondaryColor,
    },
    // Content
    content: {
      position: 'absolute',
      top: 50,
      left: 50,
      right: 50,
      bottom: 50,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Logo
    logoContainer: {
      marginBottom: 20,
    },
    logo: {
      width: 80,
      height: 80,
      objectFit: 'contain',
    },
    logoPlaceholder: {
      width: 80,
      height: 80,
      backgroundColor: primaryColor,
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoText: {
      color: '#FFFFFF',
      fontSize: 32,
      fontWeight: 'bold',
    },
    // Title
    orgName: {
      fontSize: 14,
      color: '#6B7280',
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginBottom: 16,
    },
    certificateTitle: {
      fontFamily: 'Playfair Display',
      fontSize: 42,
      fontWeight: 'bold',
      color: primaryColor,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: '#6B7280',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 40,
    },
    // Recipient
    presentedTo: {
      fontSize: 12,
      color: '#9CA3AF',
      marginBottom: 8,
    },
    recipientName: {
      fontFamily: 'Playfair Display',
      fontSize: 36,
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: 24,
      textAlign: 'center',
    },
    // Course
    forCompletion: {
      fontSize: 12,
      color: '#9CA3AF',
      marginBottom: 8,
    },
    courseTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#374151',
      marginBottom: 40,
      textAlign: 'center',
      maxWidth: '80%',
    },
    // Date and signature
    dateSignatureRow: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '80%',
      marginBottom: 30,
    },
    dateSection: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    signatureSection: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    signatureLine: {
      width: 150,
      borderBottomWidth: 1,
      borderBottomColor: '#D1D5DB',
      marginBottom: 8,
      paddingBottom: 8,
    },
    signatureText: {
      fontSize: 12,
      fontStyle: 'italic',
      color: '#6B7280',
    },
    label: {
      fontSize: 10,
      color: '#9CA3AF',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    dateText: {
      fontSize: 14,
      color: '#374151',
      marginBottom: 4,
    },
    // Footer with QR and certificate number
    footer: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
    },
    qrCode: {
      width: 60,
      height: 60,
    },
    certificateNumber: {
      fontSize: 10,
      color: '#9CA3AF',
      fontFamily: 'Inter',
    },
    verifyText: {
      fontSize: 8,
      color: '#9CA3AF',
      marginTop: 4,
    },
  })

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.container}>
          {/* Decorative borders */}
          <View style={styles.border} />
          <View style={styles.innerBorder} />
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />

          {/* Main content */}
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              {orgLogoUrl ? (
                <Image src={orgLogoUrl} style={styles.logo} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoText}>{orgName.charAt(0)}</Text>
                </View>
              )}
            </View>

            {/* Org Name */}
            <Text style={styles.orgName}>{orgName}</Text>

            {/* Certificate Title */}
            <Text style={styles.certificateTitle}>Certificate</Text>
            <Text style={styles.subtitle}>of Completion</Text>

            {/* Recipient */}
            <Text style={styles.presentedTo}>This is to certify that</Text>
            <Text style={styles.recipientName}>{recipientName}</Text>

            {/* Course */}
            <Text style={styles.forCompletion}>
              has successfully completed the course
            </Text>
            <Text style={styles.courseTitle}>{courseTitle}</Text>

            {/* Date and Signature */}
            <View style={styles.dateSignatureRow}>
              <View style={styles.dateSection}>
                <Text style={styles.dateText}>{formattedDate}</Text>
                <Text style={styles.label}>Date Issued</Text>
              </View>

              <View style={styles.signatureSection}>
                <View style={styles.signatureLine}>
                  <Text style={styles.signatureText}>
                    {instructorName || orgName}
                  </Text>
                </View>
                <Text style={styles.label}>Instructor</Text>
              </View>
            </View>

            {/* Footer with QR Code */}
            <View style={styles.footer}>
              <Image src={qrCodeDataUrl} style={styles.qrCode} />
              <View>
                <Text style={styles.certificateNumber}>
                  Certificate ID: {certificateNumber}
                </Text>
                <Text style={styles.verifyText}>
                  Scan to verify authenticity
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

/**
 * Factory function to create the certificate document element for PDF rendering
 */
export function createCertificateDocument(data: CertificateData) {
  return React.createElement(CertificateTemplate, { data })
}
