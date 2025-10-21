import re

# Read the OwnerDashboard file
with open('/components/OwnerDashboard.tsx', 'r') as f:
    content = f.read()

# Replace all font-['Inter'] with font-['Outfit']
content = content.replace("font-['Inter']", "font-['Outfit']")

# Write back to the file
with open('/components/OwnerDashboard.tsx', 'w') as f:
    f.write(content)

print("All Inter fonts replaced with Outfit fonts!")