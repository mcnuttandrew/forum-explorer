const lda = require('lda');
export function buildLDAModel(comments, topics, terms) {
  const texts = comments.map((d) => d.trim()).filter((d) => d.length);
  return new Promise((resolve) => {
    const model = lda(texts, topics, terms, ['en'], null, null, 10).filter((d) => d.length);
    resolve(model);
  });
}
