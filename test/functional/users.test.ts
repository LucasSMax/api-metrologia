import { User } from '@src/models/user';
import AuthService from '@src/services/auth';

describe('User fuctional tests', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });
  describe('When creating a new user', () => {
    it('should successfully create a new user with encrypted password', async () => {
      const newUser = {
        name: 'John Doe',
        email: 'john@mail.com',
        password: '1234',
      };

      const request = await global.testRequest.post('/users').send(newUser);
      expect(request.status).toBe(201);
      await expect(
        AuthService.comparePasswords(newUser.password, request.body.password)
      ).resolves.toBeTruthy();
      expect(request.body).toEqual(
        expect.objectContaining({
          ...newUser,
          ...{ password: expect.any(String) },
        })
      );
    });

    it('should return an error 422 when there is a vlidation error', async () => {
      const newUser = {
        email: 'john@mail.com',
        password: '1234',
      };

      const request = await global.testRequest.post('/users').send(newUser);
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

      await global.testRequest.post('/users').send(newUser);
      const request = await global.testRequest.post('/users').send(newUser);
      expect(request.status).toBe(409);
      expect(request.body).toEqual({
        code: 409,
        error: 'User validation failed: email: already exists in the database.',
      });
    });
  });
  describe('When authenticating a new user', () => {
    it('should generate a token for a valid user', async () => {
      const newUser = {
        name: 'John Doe',
        email: 'john@mail.com',
        password: '1234',
      };

      await new User(newUser).save();
      await global.testRequest
        .post('/users/authenticate')
        .send({ email: newUser.email, password: newUser.password });
      const request = await global.testRequest
        .post('/users/authenticate')
        .send(newUser);
      expect(request.body).toEqual(
        expect.objectContaining({ token: expect.any(String) })
      );
    });

    it('should return UNAUTHORIZED if the user with the given email is not found', async () => {
      const response = await global.testRequest
        .post('/users/authenticate')
        .send({ email: 'some-email@mail.com', password: '1234' });
      expect(response.status).toBe(401);
    });

    it('should return UNAUTHORIZED if the user is found but the password does not match', async () => {
      const newUser = {
        name: 'John Doe',
        email: 'john@mail.com',
        password: '1234',
      };

      await new User(newUser).save();
      const response = await global.testRequest
        .post('/users/authenticate')
        .send({ email: newUser.email, password: 'different password' });

      expect(response.status).toBe(401);
    });

  });
});
