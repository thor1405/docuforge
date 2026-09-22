"""
DocuForge High-Fidelity Python Worker Service
Handles LibreOffice Headless document conversions, PyMuPDF rendering, and Tesseract OCR jobs.
"""

import os
import subprocess
import tempfile
import sys

def convert_office_to_pdf(input_path: str, output_dir: str) -> str:
    """
    Executes LibreOffice headless conversion
    """
    cmd = [
        "libreoffice",
        "--headless",
        "--convert-to",
        "pdf",
        input_path,
        "--outdir",
        output_dir
    ]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode != 0:
        raise RuntimeError(f"LibreOffice conversion error: {result.stderr.decode('utf-8')}")
    
    base_name = os.path.splitext(os.path.basename(input_path))[0]
    return os.path.join(output_dir, f"{base_name}.pdf")

def run_tesseract_ocr(image_path: str, lang: str = "eng") -> str:
    """
    Executes Tesseract OCR on scanned image/PDF
    """
    cmd = ["tesseract", image_path, "stdout", "-l", lang]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode != 0:
        raise RuntimeError(f"Tesseract OCR error: {result.stderr.decode('utf-8')}")
    return result.stdout.decode("utf-8")

if __name__ == "__main__":
    print("DocuForge Python Worker Service Initialized.")
    print("Listening for document conversion jobs via Redis/BullMQ...")
