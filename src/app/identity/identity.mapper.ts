import { IdentityRepository } from "./identity.repository";

export class IdentityMapper {
  static user = IdentityRepository.toPublic;
}
