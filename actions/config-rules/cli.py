import argparse
from yaml import load

parser = argparse.ArgumentParser(description='Config Rules checker CLI.')
parser.add_argument('config_file', metavar='config_file', type=str, nargs=1, help='The rule config file to use.')
args = parser.parse_args()

def main():
    print('Use {0} as the rule config file.'.format(args.config_file[0]))

if __name__ == '__main__':
    main()