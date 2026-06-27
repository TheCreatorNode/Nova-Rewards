import { RedisModule } from './redis/redis.module';

// Add RedisModule to imports array
@Module({
  imports: [
    // ... other imports
    RedisModule,
    // ... other imports
  ],
})
export class AppModule {}
