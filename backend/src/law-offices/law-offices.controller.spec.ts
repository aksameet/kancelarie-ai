import { Test, TestingModule } from '@nestjs/testing';
import { LawOfficesController } from './law-offices.controller';
import { LawOfficesService } from './law-offices.service';

describe('LawOfficesController', () => {
  let controller: LawOfficesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LawOfficesController],
      providers: [LawOfficesService],
    }).compile();

    controller = module.get<LawOfficesController>(LawOfficesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
