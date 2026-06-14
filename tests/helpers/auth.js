import request from "supertest";

const DEMO_PASSWORD = "password123";

/**
 * @param {import('express').Application} app
 * @param {string} email
 */
export async function login(app, email) {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password: DEMO_PASSWORD });

  if (res.status !== 200 || !res.body?.data?.token) {
    throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data.token;
}

export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}
