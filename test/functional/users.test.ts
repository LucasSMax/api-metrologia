import { User } from '@src/models/user';

describe('User fuctional tests', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });
  describe('When creating a new user', () => {
    it('should successfully create a new user', async () => {
      const newUser = {
        name: 'John Doe',
        email: 'john@mail.com',
        password: '1234',
      };

      const request = await global.testRequest.post('/user').send(newUser);
      expect(request.status).toBe(201);
      expect(request.body).toEqual(expect.objectContaining(newUser));
    });

    it('should return an error 422 when there is a vlidation error', async () => {
      const newUser = {
        email: 'john@mail.com',
        password: '1234',
      };

      const request = await global.testRequest.post('/user').send(newUser);
      expect(request.status).toBe(422);
      expect(request.body).toEqual({
        code: 422,
        error: 'User validation failed: name: Path `name` is required.',
      });
    });

    it('should return an error 409 when there is a duplicated email', async () => {
      const newUser = {
        name: 'John Doe',
        email: 'john@mail.com',
        password: '1234',
      };

      await global.testRequest.post('/user').send(newUser);
      const request = await global.testRequest.post('/user').send(newUser);
      expect(request.status).toBe(409);
      expect(request.body).toEqual({
        code: 409,
        error: 'User validation failed: email: already exists in the database.',
      });
    });
  });
});
