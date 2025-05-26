import { Test, TestingModule } from '@nestjs/testing';
import { LawOfficesService } from './law-offices.service';

describe('LawOfficesService', () => {
  let service: LawOfficesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LawOfficesService],
    }).compile();

    service = module.get<LawOfficesService>(LawOfficesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
