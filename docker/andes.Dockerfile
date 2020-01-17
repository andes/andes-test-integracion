ARG APP=master
ARG MATRICULACIONES=master

FROM andesnqn/app:${APP} as build-stage
FROM andesnqn/matriculaciones:${MATRICULACIONES} as build-matriculaciones

FROM nginx

COPY --from=build-stage /usr/src/app/dist /usr/share/nginx/html

COPY --from=build-matriculaciones /usr/src/app/dist /usr/share/nginx/html/matriculaciones

COPY nginx.conf /etc/nginx/nginx.conf
#RUN ls /usr/share/nginx/html
#RUN nginx 

EXPOSE 80
#CMD ["nginx"]
