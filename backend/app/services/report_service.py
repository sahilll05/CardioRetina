import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.config import settings

class ReportService:
    """Generate PDF reports"""
    
    @staticmethod
    def generate_report(analysis_data, patient_data, visit_data):
        """
        Generate PDF report
        
        Returns: path to generated PDF
        """
        # Create filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"report_{analysis_data['job_id']}_{timestamp}.pdf"
        filepath = os.path.join(settings.REPORT_DIR, filename)
        
        # Create PDF
        doc = SimpleDocTemplate(filepath, pagesize=letter)
        story = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#2c3e50'),
            spaceAfter=30,
        )
        story.append(Paragraph("CardioRetina AI Analysis Report", title_style))
        story.append(Spacer(1, 0.2*inch))
        
        # Patient Info
        story.append(Paragraph("Patient Information", styles['Heading2']))
        patient_table = Table([
            ["Name:", patient_data.get('name', 'N/A')],
            ["Age:", str(patient_data.get('age', 'N/A'))],
            ["Patient ID:", patient_data.get('patient_id', 'N/A')],
            ["Date:", datetime.utcnow().strftime("%Y-%m-%d %H:%M")]
        ])
        patient_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#ecf0f1')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
        ]))
        story.append(patient_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Biomarkers
        if analysis_data.get('biomarkers'):
            story.append(Paragraph("Retinal Biomarkers", styles['Heading2']))
            biomarkers = analysis_data['biomarkers']
            bio_table = Table([
                ["Biomarker", "Value", "Status"],
                ["A/V Ratio", f"{biomarkers.get('av_ratio', 0):.3f}", 
                 "Normal" if biomarkers.get('av_ratio', 0) >= 0.65 else "Abnormal"],
                ["Vessel Density", f"{biomarkers.get('vessel_density', 0):.3f}", "Normal"],
                ["Tortuosity", f"{biomarkers.get('tortuosity', 0):.3f}", 
                 "Normal" if biomarkers.get('tortuosity', 0) <= 1.2 else "Abnormal"],
                ["Branching Angle", f"{biomarkers.get('branching_angle', 0):.1f}°", "Normal"]
            ])
            bio_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3498db')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(bio_table)
            story.append(Spacer(1, 0.3*inch))
        
        # Disease Assessment
        if analysis_data.get('disease'):
            story.append(Paragraph("Disease Screening", styles['Heading2']))
            disease = analysis_data['disease']
            grade_map = {
                0: "No DR",
                1: "Mild DR",
                2: "Moderate DR",
                3: "Severe DR",
                4: "Proliferative DR"
            }
            disease_table = Table([
                ["DR Grade:", grade_map.get(disease.get('dr_grade', 0), 'Unknown')],
                ["Confidence:", f"{disease.get('dr_probability', 0)*100:.1f}%"]
            ])
            disease_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#ecf0f1')),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
            ]))
            story.append(disease_table)
            story.append(Spacer(1, 0.3*inch))
        
        # Risk Assessment
        if analysis_data.get('risk'):
            story.append(Paragraph("Cardiovascular Risk Assessment", styles['Heading2']))
            risk = analysis_data['risk']
            
            risk_color = {
                'LOW': colors.green,
                'MODERATE': colors.orange,
                'HIGH': colors.red
            }
            
            risk_table = Table([
                ["Risk Level:", risk.get('risk_level', 'UNKNOWN')],
                ["Confidence:", f"{risk.get('confidence', 0)*100:.1f}%"]
            ])
            risk_table.setStyle(TableStyle([
                ('BACKGROUND', (1, 0), (1, 0), risk_color.get(risk.get('risk_level'), colors.grey)),
                ('TEXTCOLOR', (1, 0), (1, 0), colors.whitesmoke),
                ('FONTNAME', (1, 0), (1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(risk_table)
            story.append(Spacer(1, 0.2*inch))
            
            # Risk Reasons
            if risk.get('reasons'):
                story.append(Paragraph("Risk Factors:", styles['Heading3']))
                for reason in risk['reasons']:
                    story.append(Paragraph(f"• {reason}", styles['Normal']))
                story.append(Spacer(1, 0.2*inch))
        
        # Recommendations
        story.append(Paragraph("Recommendations", styles['Heading2']))
        recommendations = [
            "Regular monitoring of blood pressure and blood sugar levels",
            "Follow up with ophthalmologist for detailed examination",
            "Maintain healthy lifestyle with balanced diet and exercise",
            "Schedule next screening in 6-12 months"
        ]
        for rec in recommendations:
            story.append(Paragraph(f"• {rec}", styles['Normal']))
        
        # Build PDF
        doc.build(story)
        
        return filepath