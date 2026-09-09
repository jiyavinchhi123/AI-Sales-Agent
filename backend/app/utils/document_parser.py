"""
Document Parser Utility
Extracts plain text from PDF, DOCX, and TXT files for LLM business profile ingestion.
"""

import io
import zipfile
import xml.etree.ElementTree as ET
from typing import Tuple


def extract_text_from_file(filename: str, content: bytes) -> Tuple[str, str]:
    """
    Extracts text from uploaded file bytes based on file extension.
    Returns (extracted_text, status_message).
    """
    lower_name = filename.lower()

    if lower_name.endswith('.txt'):
        try:
            text = content.decode('utf-8', errors='replace')
            return text, f"Successfully parsed TXT: {filename}"
        except Exception as e:
            return "", f"Failed to parse TXT {filename}: {str(e)}"

    elif lower_name.endswith('.pdf'):
        try:
            # Try PyMuPDF (fitz) first, then pypdf
            try:
                import fitz  # PyMuPDF
                doc = fitz.open(stream=content, filetype="pdf")
                pages = [page.get_text() for page in doc]
                return "\n\n".join(pages), f"Parsed PDF ({len(pages)} pages) using PyMuPDF: {filename}"
            except ImportError:
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(content))
                pages = [page.extract_text() or "" for page in reader.pages]
                return "\n\n".join(pages), f"Parsed PDF ({len(pages)} pages) using PyPDF: {filename}"
        except Exception as e:
            return "", f"Failed to parse PDF {filename}: {str(e)}"

    elif lower_name.endswith('.docx'):
        try:
            # DOCX files are zip archives containing word/document.xml
            with zipfile.ZipFile(io.BytesIO(content)) as docx_zip:
                xml_content = docx_zip.read('word/document.xml')
                tree = ET.fromstring(xml_content)
                # Word document text tags are {http://schemas.openxmlformats.org/wordprocessingml/2006/main}t
                texts = [node.text for node in tree.iter() if node.text]
                extracted = " ".join(texts)
                return extracted, f"Parsed DOCX ({len(extracted)} chars): {filename}"
        except Exception as e:
            return "", f"Failed to parse DOCX {filename}: {str(e)}"

    else:
        return "", f"Unsupported file type: {filename}. Supported formats: PDF, DOCX, TXT."
