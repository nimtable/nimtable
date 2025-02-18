#!/usr/bin/env python3

from ruamel.yaml import YAML
from copy import deepcopy

def merge_parameters(path_params, operation_params):
    """Merge path parameters into operation parameters, preserving any existing operation parameters"""
    if not path_params:
        return operation_params or []
    
    operation_params = operation_params or []
    operation_params.extend(path_params)
    return operation_params

def process_yaml(file_path):
    yaml = YAML()
    yaml.preserve_quotes = True
    yaml.width = 4096  # Prevent line wrapping
    
    with open(file_path, 'r') as f:
        data = yaml.load(f)
    
    paths = data.get('paths', {})
    for path, path_content in paths.items():
        if not isinstance(path_content, dict):
            continue
            
        # Get path-level parameters if they exist
        path_params = path_content.get('parameters', [])
        
        # Process each HTTP method
        for method, method_content in list(path_content.items()):
            if method == 'parameters' or not isinstance(method_content, dict):
                continue
                
            # Merge parameters
            method_content['parameters'] = merge_parameters(
                path_params,
                method_content.get('parameters')
            )
        
        # Remove path-level parameters
        if 'parameters' in path_content:
            del path_content['parameters']
    
    # Write the modified YAML back to file
    with open(file_path, 'w') as f:
        yaml.dump(data, f)

if __name__ == '__main__':
    import sys
    if len(sys.argv) < 2:
        print("Please provide a YAML file path as argument")
        sys.exit(1)
    file_path = sys.argv[1]
    process_yaml(file_path)
    print("OK")
