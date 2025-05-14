interface User {
  psid: string;
  firstName: string;
  lastName?: string;
  locale?: string;
  timezone?: string;
  gender?: string;
}

declare module "../services/user" {
  export { User };
}
