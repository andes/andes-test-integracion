ARG TAG=master

FROM andesnqn/app:${TAG} as build-stage

FROM nginx

COPY --from=build-stage /usr/src/app/dist /usr/share/nginx/html

CMD nginx