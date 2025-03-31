import os
import sys

def find_capital_letters(filename):
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            for line_num, line in enumerate(file, start=1):
                parts = line.split("https://", 1)
                first_part = parts[0] if parts else ""
                for col_num, char in enumerate(first_part, start=1):
                    if char.isupper():
                        print(f"Capital letter '{char}' found at Line {line_num}, Column {col_num}")
    except FileNotFoundError:
        print(f"Error: File '{filename}' not found.")
    except Exception as e:
        print(f"An error occurred: {e}")

# Example usage
if __name__ == "__main__":
    filename = os.path.abspath(sys.argv[1])
    find_capital_letters(filename)