# Manual to build the docker image and start it
1. Place `samrequirements.txt` and `samworker.dockerfile` in `.docker` in the biigle root folder
2. Download the `sam_vit_h_4b8939.pth` to the `microservice` folder (the one where this file is in)
3. Build the image with  `docker build -t fastapi-ml-service .`
4. Add the samworker definition below into `docker-compose.yml`





# docker-compose.yml samworker definition
```
  samworker:
    image: fastapi-ml-service:latest
    user: ${USER_ID}:${GROUP_ID}
    depends_on:
      - app
      - database_testing
    build:
      context: ./.docker/
      dockerfile: samworker.dockerfile
    working_dir: /var/www
    volumes:
      - ./:/var/www
    tmpfs:
      - /tmp
      - /var/www/storage/framework/testing/disks:uid=${USER_ID},gid=${GROUP_ID}
    ports:
      - 8080:8080
    environment:
      - "DB_PORT=5432"
    init: true
```