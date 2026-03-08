/**
 * Extrai a primeira e a última palavra de uma string.
 * @param str A string de entrada.
 * @returns Uma string contendo a primeira e a última palavra da string de entrada.
 */
export const getFirstAndLastWord = (str: string) => {
  const words = str.trim().split(/\s+/);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0];
  return `${words[0]} ${words[words.length - 1]}`;
};

/**
 * Retorna as iniciais de uma string.
 * @param str A string de entrada.
 * @returns Uma string contendo as iniciais de cada palavra da string de entrada.
 */
export const getInitials = (str: string) => {
  const words = str.trim().split(/\s+/);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0][0].toUpperCase();
  let initials = "";
  for (const word of words) {
    initials += word[0].toUpperCase();
  }
  return initials;
};
