ARG APP=master

FROM andesnqn/app:${APP} as build-stage

FROM nginx

COPY --from=build-stage /usr/src/app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/nginx.conf
#RUN ls /usr/share/nginx/html
#RUN nginx 

EXPOSE 80
#CMD ["nginx"]
