"""
Markdown formatting utilities for enhancing AI-generated summaries.
Transforms plain markdown into properly formatted, visually structured content.
"""

import re


def format_summary_markdown(text: str) -> str:
    """
    Clean and prepare markdown text from AI service for frontend rendering.
    
    This function ONLY removes problematic wrappers and artifacts.
    It does NOT modify the actual content to preserve summary completeness.
    
    Args:
        text: Raw markdown text from AI service
        
    Returns:
        str: Cleaned markdown ready for marked.js parsing
    """
    if not text:
        return text
    
    # Step 1: Remove code fences (```markdown ... ``` or ``` ... ```)
    # These prevent proper rendering
    text = re.sub(r'^```(?:markdown|md)?\s*\n', '', text, flags=re.MULTILINE)
    text = re.sub(r'\n```\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^```(?:markdown|md)?\s*$', '', text, flags=re.MULTILINE)
    text = text.replace('```markdown\n', '').replace('\n```', '').replace('```', '')
    
    # Step 2: Remove table of contents sections with anchor links
    # Pattern: - [Text](#anchor-link)
    lines = text.split('\n')
    cleaned_lines = []
    skip_toc = False
    
    for i, line in enumerate(lines):
        # Detect TOC pattern: list items with anchor links
        if re.match(r'^\s*[\-\*]\s*\*?\*?\[.+\]\(#.+\)\*?\*?\s*$', line):
            # Look ahead to confirm it's a TOC block (multiple anchor links)
            toc_count = sum(
                1 for j in range(i, min(i + 8, len(lines)))
                if re.match(r'^\s*[\-\*]\s*\*?\*?\[.+\]\(#.+\)\*?\*?\s*$', lines[j])
            )
            if toc_count >= 3:
                skip_toc = True
                continue
        # Stop skipping after TOC block ends
        elif skip_toc and line.strip() and not re.match(r'^\s*[\-\*]\s*\*?\*?\[.+\]\(#.+\)\*?\*?\s*$', line):
            skip_toc = False
        
        if not skip_toc:
            cleaned_lines.append(line)
    
    # Rejoin cleaned lines
    text = '\n'.join(cleaned_lines)
    
    # Step 3: Clean up excessive blank lines (more than 2 consecutive)
    text = re.sub(r'\n{4,}', '\n\n\n', text)
    
    # Step 4: Remove meta commentary if present
    text = re.sub(r'^(here is the summary:?|summary:?)\s*\n', '', text, flags=re.IGNORECASE | re.MULTILINE)
    
    # Return cleaned text - marked.js will handle all formatting
    return text.strip()


def enhance_summary_response(summary_data: dict) -> dict:
    """
    Clean the summary response for frontend rendering.
    
    Args:
        summary_data: Dictionary containing 'summary' and optionally other fields
        
    Returns:
        dict: Cleaned summary data ready for marked.js parsing
    """
    if 'summary' in summary_data and isinstance(summary_data['summary'], str):
        summary_data['summary'] = format_summary_markdown(summary_data['summary'])
    
    return summary_data
