import os
import sys
import json

def generate_mapping(directory):
    # Absolute path of the directory
    directory = os.path.abspath(directory)
    
    # Check if the directory exists
    if not os.path.exists(directory):
        print(f"Directory '{directory}' does not exist.")
        return

    # Initialize the dictionary
    emoticon_dict = {}

    # Iterate through the files in the directory
    for filename in os.listdir(directory):
        # Check if the file ends with '_40x40.gif'
        if filename.endswith('_40x40.gif'):
            # Extract the emotion part (everything before '_40x40.gif')
            emotion = filename.replace('_40x40.gif', '')
            # Construct the URL (you can replace <url_pre> and <url_post> with your own values)
            url_pre = "https://github.com/sbamboo/SkypeExportViewer/blob/main/assets/emoticons/"
            url_post = "?raw=true"
            emoticon_dict[emotion] = f"{url_pre}{filename}{url_post}"

    # Prepare the JS source code
    js_content = f"""
const EMOTICON_MAPPING = {{
    // Abbriviations map one emoticon-string to another example ":)" to "smile"
    abbrivs: {{
    }},
    // Add explicit mappings here mapping "emoticon" to "emoticon_url" (gif)
    emoticons: {json.dumps(emoticon_dict, indent=4)},
    // This url is used when the emoticon is not found in the above mappings, and is used to fetch the emoticon automatically
    auto_mapping: null
}};
"""

    # Write the JS content to a file
    output_file = "emoticon_mapping.js"
    with open(output_file, 'w') as f:
        f.write(js_content)
    
    print(f"JS file generated successfully: {output_file}")

if __name__ == "__main__":
    # Ensure directory is passed as a command line argument
    if len(sys.argv) != 2:
        print("Usage: python script.py <directory>")
    else:
        # Generate the mapping using the provided directory
        generate_mapping(sys.argv[1])
