export function classnames(classObject) {
  return Object.keys(classObject).filter(name => classObject[name]).join(' ');
}
