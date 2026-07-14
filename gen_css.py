import json
import re

html = """
<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>A &amp; A Logistics - Tax Invoice</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;700&amp;family=Manrope:wght@600;700;800&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "on-error": "#ffffff",
                        "surface-dim": "#c7dde9",
                        "on-background": "#071e27",
                        "on-secondary-fixed": "#002021",
                        "inverse-surface": "#1e333c",
                        "background": "#f3faff",
                        "on-secondary-container": "#00284d",
                        "surface-container-low": "#e6f6ff",
                        "on-tertiary-container": "#8a9b9b",
                        "primary-fixed": "#cae6ff",
                        "surface": "#f3faff",
                        "on-tertiary-fixed": "#0e1e1e",
                        "error-container": "#ffdad6",
                        "tertiary-container": "#233333",
                        "inverse-on-surface": "#dff4ff",
                        "on-surface": "#071e27",
                        "secondary": "#0047b3",
                        "surface-bright": "#f3faff",
                        "surface-container": "#dbf1fe",
                        "surface-container-highest": "#cfe6f2",
                        "tertiary-fixed-dim": "#b8cac9",
                        "on-primary-fixed-variant": "#214a66",
                        "error": "#ba1a1a",
                        "primary-container": "#00334e",
                        "on-secondary": "#ffffff",
                        "surface-container-high": "#d5ecf8",
                        "on-secondary-fixed-variant": "#00284d",
                        "on-primary": "#ffffff",
                        "on-surface-variant": "#42474d",
                        "secondary-container": "#cce0ff",
                        "inverse-primary": "#a4cbec",
                        "tertiary": "#0e1e1e",
                        "on-primary-container": "#759cbb",
                        "on-tertiary-fixed-variant": "#3a4a49",
                        "outline": "#72787e",
                        "on-error-container": "#93000a",
                        "on-tertiary": "#ffffff",
                        "tertiary-fixed": "#d4e6e5",
                        "surface-variant": "#cfe6f2",
                        "primary": "#001d2f",
                        "primary-fixed-dim": "#a4cbec",
                        "on-primary-fixed": "#001e30",
                        "secondary-fixed-dim": "#99c2ff",
                        "surface-tint": "#3b627f",
                        "surface-container-lowest": "#ffffff",
                        "secondary-fixed": "#b3d1ff",
                        "outline-variant": "#c2c7ce"
                    },
                    spacing: {
                        "gutter": "16px",
                        "section-padding": "24px",
                        "base": "4px",
                        "margin-mobile": "16px",
                        "margin-desktop": "32px"
                    },
                    fontSize: {
                        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
                        "label-bold": ["12px", { lineHeight: "16px", fontWeight: "700" }],
                        "headline-lg": ["24px", { lineHeight: "32px", fontWeight: "700" }],
                        "headline-lg-mobile": ["20px", { lineHeight: "28px", fontWeight: "700" }],
                        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
                        "label-sm": ["11px", { lineHeight: "14px", fontWeight: "500" }],
                        "display-lg": ["36px", { lineHeight: "44px", letterSpacing: "-0.02em", fontWeight: "800" }],
                        "headline-md": ["18px", { lineHeight: "24px", fontWeight: "600" }]
                    }
                }
            }
        }
    </script>
"""

# We can parse the colors and spacing and fontSize manually from the string
colors = {
    "on-error": "#ffffff", "surface-dim": "#c7dde9", "on-background": "#071e27", 
    "on-secondary-fixed": "#002021", "inverse-surface": "#1e333c", "background": "#f3faff",
    "on-secondary-container": "#00284d", "surface-container-low": "#e6f6ff",
    "on-tertiary-container": "#8a9b9b", "primary-fixed": "#cae6ff", "surface": "#f3faff",
    "on-tertiary-fixed": "#0e1e1e", "error-container": "#ffdad6", "tertiary-container": "#233333",
    "inverse-on-surface": "#dff4ff", "on-surface": "#071e27", "secondary": "#0047b3",
    "surface-bright": "#f3faff", "surface-container": "#dbf1fe", "surface-container-highest": "#cfe6f2",
    "tertiary-fixed-dim": "#b8cac9", "on-primary-fixed-variant": "#214a66", "error": "#ba1a1a",
    "primary-container": "#00334e", "on-secondary": "#ffffff", "surface-container-high": "#d5ecf8",
    "on-secondary-fixed-variant": "#00284d", "on-primary": "#ffffff", "on-surface-variant": "#42474d",
    "secondary-container": "#cce0ff", "inverse-primary": "#a4cbec", "tertiary": "#0e1e1e",
    "on-primary-container": "#759cbb", "on-tertiary-fixed-variant": "#3a4a49", "outline": "#72787e",
    "on-error-container": "#93000a", "on-tertiary": "#ffffff", "tertiary-fixed": "#d4e6e5",
    "surface-variant": "#cfe6f2", "primary": "#001d2f", "primary-fixed-dim": "#a4cbec",
    "on-primary-fixed": "#001e30", "secondary-fixed-dim": "#99c2ff", "surface-tint": "#3b627f",
    "surface-container-lowest": "#ffffff", "secondary-fixed": "#b3d1ff", "outline-variant": "#c2c7ce"
}

spacing = {
    "gutter": "16px", "section-padding": "24px", "base": "4px",
    "margin-mobile": "16px", "margin-desktop": "32px"
}

# The easiest approach is to add a plugin to tailwind config or add the variables as an object.
# But we can also just create a mapping.

css_vars = []
for k, v in colors.items():
    css_vars.append(f"--inv-{k}: {v};")

# Let's write the CSS variables to a string
css_str = "\\n".join(css_vars)
print(css_str)
