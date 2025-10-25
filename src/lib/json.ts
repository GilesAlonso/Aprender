export const safeJsonParse = <T>(value: string | null | undefined): T | null => {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn("Não foi possível fazer o parse do JSON armazenado.", error);
    return null;
  }
};

export const safeJsonStringify = (value: unknown): string | null => {
  if (value === undefined || value === null) {
    return null;
  }

  try {
    return JSON.stringify(value);
  } catch (error) {
    console.warn("Não foi possível serializar o valor para JSON.", error);
    return null;
  }
};
