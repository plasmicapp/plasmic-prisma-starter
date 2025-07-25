
/**
 * https://github.com/prisma/prisma/issues/11940#issuecomment-3106962088
 */
export function tableNameToMethodName<T extends string>(self: T): Uncapitalize<T> {
  return (self.substring(0, 1).toLowerCase() + self.substring(1)) as Uncapitalize<T>
}