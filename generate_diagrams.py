from PIL import Image, ImageDraw, ImageFont

def create_diagram(title, steps, filename):
    # Image size
    width, height = 800, 100 * len(steps) + 150
    image = Image.new('RGB', (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(image)

    # Title
    title_font = ImageFont.load_default(size=30)
    draw.text((width // 2, 40), title, fill=(0, 0, 0), font=title_font, anchor="mm")

    # Draw steps
    box_width, box_height = 400, 60
    box_x = (width - box_width) // 2
    step_font = ImageFont.load_default(size=18)

    for i, step in enumerate(steps):
        y = 100 + i * 100
        # Box
        draw.rectangle([box_x, y, box_x + box_width, y + box_height], outline=(0, 0, 0), width=2)
        # Text
        draw.text((width // 2, y + box_height // 2), step, fill=(0, 0, 0), font=step_font, anchor="mm")

        # Arrow
        if i < len(steps) - 1:
            draw.line([width // 2, y + box_height, width // 2, y + 100], fill=(0, 0, 0), width=2)
            draw.polygon([width // 2 - 5, y + 95, width // 2 + 5, y + 95, width // 2, y + 100], fill=(0, 0, 0))

    image.save(filename)

# Diagram for AI Email Assistant
email_steps = [
    "1. New Email Received",
    "2. Fetch Unprocessed Emails",
    "3. Send to OpenAI Assistant",
    "4. Analyze Content & Sentiment",
    "5. Apply AI/Category Label",
    "6. Create Gmail Draft Reply",
    "7. Log Details to Sheet",
    "8. Mark as AI/Processed"
]
create_diagram("AI Email Assistant Workflow", email_steps, "ai-email-assistant/workflow.png")

# Diagram for AI Gmail Invoice Intake
invoice_steps = [
    "1. New Invoice Labeled 'AI-Invoice-Intake'",
    "2. Extract Data with GPT-4o-mini",
    "3. Validate Math & Confidence",
    "4. Decide Status (Approved/Review)",
    "5. Log Extracted Data to Sheet",
    "6. Mark as AI-Invoice-Processed"
]
create_diagram("AI Gmail Invoice Intake Workflow", invoice_steps, "ai-gmail-invoice-intake/workflow.png")
