import json
import os
from typing import Dict, List, Any, Optional


def escape_sql_value(val: Any) -> str:
    """
    Safely escape values for SQL insertion.
    
    Args:
        val: The value to escape
        
    Returns:
        Escaped SQL value as string
    """
    if val is None:
        return "NULL"
    elif isinstance(val, str):
        # Escape single quotes and backslashes
        safe_val = val.replace("'", "''").replace("\\", "\\\\")
        return f"'{safe_val}'"
    elif isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    elif isinstance(val, (int, float)):
        return str(val)
    else:
        # Handle other data types by converting to string and escaping
        safe_val = str(val).replace("'", "''").replace("\\", "\\\\")
        return f"'{safe_val}'"


def generate_batch_insert(table_name: str, columns: List[str], data_list: List[Dict[str, Any]], 
                         exclude_columns: Optional[List[str]] = None, 
                         conflict_columns: Optional[List[str]] = None,
                         conflict_action: str = "DO NOTHING") -> List[str]:
    """
    Generate batch INSERT statements for a table with ON CONFLICT handling.
    
    Args:
        table_name: Name of the SQL table
        columns: List of column names to include
        data_list: List of dictionaries containing the data
        exclude_columns: List of columns to exclude (e.g., SERIAL columns)
        conflict_columns: List of columns that define the conflict constraint
        conflict_action: Action to take on conflict ("DO NOTHING" or "DO UPDATE SET ...")
        
    Returns:
        List of SQL INSERT statements with ON CONFLICT clauses
    """
    if not data_list:
        return []
    
    if exclude_columns:
        columns = [col for col in columns if col not in exclude_columns]
    
    statements = []
    batch_size = 100  # Number of rows per INSERT statement
    
    for i in range(0, len(data_list), batch_size):
        batch = data_list[i:i + batch_size]
        values_list = []
        
        for row in batch:
            row_values = []
            for col in columns:
                val = row.get(col)
                row_values.append(escape_sql_value(val))
            values_list.append(f"({', '.join(row_values)})")
        
        col_str = ", ".join(columns)
        values_str = ",\n    ".join(values_list)
        
        # Build the base INSERT statement
        statement = f"INSERT INTO {table_name} ({col_str}) VALUES\n    {values_str}"
        
        # Add ON CONFLICT clause if specified
        if conflict_columns:
            conflict_cols_str = ", ".join(conflict_columns)
            statement += f"\nON CONFLICT ({conflict_cols_str}) {conflict_action}"
        
        statement += ";"
        statements.append(statement)
    
    return statements


def main():
    # File mapping with conflict handling configuration
    json_files = {
        'courses': {
            'filename': 'extracted_courses.json',
            'table': 'Courses',
            'columns': ['class_code', 'class_name'],
            'exclude': [],
            'conflict_columns': ['class_code'],  # Unique constraint on class_code
            'conflict_action': 'DO NOTHING'
        },
        'majors': {
            'filename': 'majors.json',
            'table': 'Majors',
            'columns': ['three_letter_code', 'name'],
            'exclude': [],
            'conflict_columns': ['three_letter_code'],  # Assuming unique constraint
            'conflict_action': 'DO NOTHING'
        },
        'students': {
            'filename': 'student.json',
            'table': 'Students',
            'columns': ['first_name', 'last_name', 'graduation_year'],
            'exclude': [],
            'conflict_columns': None,  # No unique constraints expected
            'conflict_action': 'DO NOTHING'
        },
        'certificates': {
            'filename': 'certificates.json',
            'table': 'Certificates',
            'columns': ['name'],
            'exclude': [],
            'conflict_columns': ['name'],  # Assuming unique constraint on name
            'conflict_action': 'DO NOTHING'
        },
        'minors': {
            'filename': 'minors.json',
            'table': 'Minors',
            'columns': ['name'],
            'exclude': [],
            'conflict_columns': ['name'],  # Assuming unique constraint on name
            'conflict_action': 'DO NOTHING'
        },
        'student_classes': {
            'filename': 'student_classes.json',
            'table': 'StudentCourses',
            'columns': ['student_id', 'class_id', 'enrollment_year', 'semester'],
            'exclude': [],
            'conflict_columns': ['student_id', 'class_id', 'enrollment_year', 'semester'],  # Composite unique constraint
            'conflict_action': 'DO NOTHING'
        },
        'student_major': {
            'filename': 'student_major.json',
            'table': 'StudentMajors',
            'columns': ['student_id', 'major_id'],
            'exclude': [],
            'conflict_columns': ['student_id', 'major_id'],  # Composite unique constraint
            'conflict_action': 'DO NOTHING'
        },
        'student_minor': {
            'filename': 'student_minor.json',
            'table': 'StudentMinors',
            'columns': ['student_id', 'minor_id'],
            'exclude': [],
            'conflict_columns': ['student_id', 'minor_id'],  # Composite unique constraint
            'conflict_action': 'DO NOTHING'
        },
        'student_certificate': {
            'filename': 'student_certificate.json',
            'table': 'StudentCertificates',
            'columns': ['student_id', 'certificate_id'],
            'exclude': [],
            'conflict_columns': ['student_id', 'certificate_id'],  # Composite unique constraint
            'conflict_action': 'DO NOTHING'
        },
        'student_tips': {
            'filename': 'student_tip.json',
            'table': 'StudentTips',
            'columns': ['student_id', 'tip_text'],  # Excluding student_tip_id as it's SERIAL
            'exclude': ['student_tip_id'],
            'conflict_columns': None,  # Tips can have duplicates
            'conflict_action': 'DO NOTHING'
        }
    }
    
    output_file = 'seed_data.sql'
    
    # Load all JSON data
    data = {}
    print("Loading JSON files...")
    for key, config in json_files.items():
        filename = config['filename']
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                data[key] = json.load(f)
            print(f"✓ Loaded {filename} ({len(data[key])} records)")
        except FileNotFoundError:
            print(f"⚠ Warning: {filename} not found, skipping.")
            data[key] = []
        except json.JSONDecodeError as e:
            print(f"✗ Error: Invalid JSON in {filename}: {e}")
            data[key] = []
        except Exception as e:
            print(f"✗ Error loading {filename}: {e}")
            data[key] = []
    
    # Processing order - important for foreign key constraints
    processing_order = [
        'courses',      # Independent table
        'majors',       # Independent table
        'minors',       # Independent table
        'certificates', # Independent table
        'students',     # Independent table
        'student_major',        # Depends on students, majors
        'student_minor',        # Depends on students, minors
        'student_certificate',  # Depends on students, certificates
        'student_classes',      # Depends on students, courses
        'student_tips'          # Depends on students
    ]
    
    total_records = 0
    
    try:
        with open(output_file, 'w', encoding='utf-8') as out_sql:
            # Write header
            out_sql.write("-- Database Seed File\n")
            out_sql.write("-- Auto-generated from JSON files with ON CONFLICT handling\n")
            out_sql.write("-- \n")
            out_sql.write("-- Usage: psql -d your_database -f seed_data.sql\n")
            out_sql.write("-- \n")
            out_sql.write("-- This script handles duplicate key conflicts gracefully.\n")
            out_sql.write("-- Make sure your database schema is already created.\n\n")
            
            # Optional: Add transaction wrapper
            out_sql.write("BEGIN;\n\n")
            
            # Process each table in order
            for key in processing_order:
                if key not in json_files or not data.get(key):
                    continue
                
                config = json_files[key]
                table_name = config['table']
                columns = config['columns']
                exclude_columns = config.get('exclude', [])
                conflict_columns = config.get('conflict_columns')
                conflict_action = config.get('conflict_action', 'DO NOTHING')
                dataset = data[key]
                
                print(f"Processing {key} -> {table_name}...")
                
                out_sql.write(f"-- ========================================\n")
                out_sql.write(f"-- Inserting {table_name} ({len(dataset)} records)\n")
                if conflict_columns:
                    out_sql.write(f"-- Conflict handling: ON CONFLICT ({', '.join(conflict_columns)}) {conflict_action}\n")
                out_sql.write(f"-- ========================================\n\n")
                
                try:
                    statements = generate_batch_insert(
                        table_name, columns, dataset, exclude_columns, 
                        conflict_columns, conflict_action
                    )
                    
                    for stmt in statements:
                        out_sql.write(stmt + "\n\n")
                    
                    total_records += len(dataset)
                    print(f"✓ Generated {len(statements)} INSERT statements for {table_name}")
                    
                except Exception as e:
                    print(f"✗ Error processing {key}: {e}")
                    out_sql.write(f"-- ERROR processing {table_name}: {e}\n\n")
            
            # Close transaction
            out_sql.write("COMMIT;\n\n")
            
            # Add summary
            out_sql.write("-- ========================================\n")
            out_sql.write("-- Summary\n")
            out_sql.write("-- ========================================\n")
            out_sql.write(f"-- Total records processed: {total_records}\n")
            out_sql.write("-- Seed data generation completed successfully\n")
            out_sql.write("-- All INSERT statements include ON CONFLICT handling to prevent duplicate key errors\n")
    
    except Exception as e:
        print(f"✗ Error writing to {output_file}: {e}")
        return
    
    print(f"\n🎉 Successfully generated {output_file}")
    print(f"📊 Total records processed: {total_records}")
    print(f"🛡️  All INSERT statements include ON CONFLICT handling")
    print(f"\nTo load this data into your database:")
    print(f"  psql -d your_database -f {output_file}")
    print(f"\nOr with connection details:")
    print(f"  psql -h hostname -U username -d database_name -f {output_file}")
    print(f"\nFor Supabase local development:")
    print(f"  supabase db reset")
    print(f"  # Then copy the contents of {output_file} to supabase/seed.sql")


if __name__ == "__main__":
    main()